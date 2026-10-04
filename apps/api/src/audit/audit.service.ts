import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { ActorContext } from "../common/api.types";

type AuditInput<T, TPrepared = undefined> = {
  functionId: string;
  functionName: string;
  sourceType: string;
  sourceId: string | ((result: T) => string);
  action: string;
  actor: ActorContext;
  before?: unknown;
  prepare?: () => Promise<TPrepared>;
  operation: (transaction: Prisma.TransactionClient, prepared: TPrepared) => Promise<T>;
  after?: (result: T) => unknown;
};

function json(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === "bigint" ? item.toString() : item,
    ),
  ) as Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async execute<T, TPrepared = undefined>(input: AuditInput<T, TPrepared>): Promise<T> {
    const ProcessId = randomUUID();
    const started = new Date();
    await this.prisma.logProcess.create({
      data: {
        ProcessId,
        FunctionId: input.functionId,
        FunctionName: input.functionName,
        RequestId: input.actor.RequestId,
        ProcessStatus: "RUNNING",
        ProcessStart: started,
        ProcessDate: started,
        CreatedBy: input.actor.Actor,
      },
    });

    try {
      const prepared = input.prepare
        ? await input.prepare()
        : undefined as TPrepared;
      const result = await this.prisma.$transaction(async (transaction) => {
        const output = await input.operation(transaction, prepared);
        await transaction.actionAuditEvent.create({
          data: {
            SourceType: input.sourceType,
            SourceId: typeof input.sourceId === "function" ? input.sourceId(output) : input.sourceId,
            Action: input.action,
            Actor: input.actor.Actor,
            ActorSource: input.actor.ActorSource,
            RequestId: input.actor.RequestId,
            ProcessId,
            Before: json(input.before),
            After: json(input.after?.(output) ?? output),
          },
        });
        return output;
      }, { isolationLevel: "Serializable" });

      await this.prisma.$transaction([
        this.prisma.logProcessDetail.create({
          data: {
            ProcessId,
            MessageId: "SUCCESS",
            Message: `${input.action} completed`,
            Type: "INFO",
            Location: input.sourceType,
            ProcessDate: new Date(),
          },
        }),
        this.prisma.logProcess.update({
          where: { ProcessId },
          data: { ProcessStatus: "SUCCESS", ProcessEnd: new Date() },
        }),
      ]);
      return result;
    } catch (error) {
      await this.prisma.$transaction([
        this.prisma.logProcessDetail.create({
          data: {
            ProcessId,
            MessageId: "FAILED",
            Message: error instanceof Error ? error.message.slice(0, 500) : "Mutation failed",
            Type: "ERROR",
            Location: input.sourceType,
            ProcessDate: new Date(),
          },
        }),
        this.prisma.logProcess.update({
          where: { ProcessId },
          data: { ProcessStatus: "FAILED", ProcessEnd: new Date() },
        }),
      ]);
      throw error;
    }
  }
}
