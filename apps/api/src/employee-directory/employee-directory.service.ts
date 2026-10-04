import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { DepartmentDirectoryQueryDto, EmployeeDirectoryQueryDto } from "./employee-directory.dto";

type EssaEmployee = {
  EmployeeNo?: string | null;
  FirstName?: string | null;
  MiddleName?: string | null;
  LastName?: string | null;
};

type EssaLevel = {
  LevelType?: string | null;
  LevelCode?: string | null;
  LevelName?: string | null;
};

type EssaEnvelope<T> = {
  success?: boolean;
  data?: T;
};

export type DirectoryEmployee = {
  EmployeeNo: string;
  EmployeeName: string;
  DisplayLabel: string;
};

export type DirectoryDepartment = {
  Code: string;
  Name: string;
  DisplayLabel: string;
};

@Injectable()
export class EmployeeDirectoryService {
  constructor(private readonly config: ConfigService) {}

  private configuration() {
    const baseUrl = this.config.get<string>("ESSA_API_URL")?.trim().replace(/\/+$/, "");
    const apiKey = this.config.get<string>("ESSA_API_KEY")?.trim();
    const configuredTimeout = Number(this.config.get<string>("ESSA_API_TIMEOUT_MS") ?? "5000");
    const timeout = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 5000;
    if (!baseUrl || !apiKey) {
      throw new ServiceUnavailableException("Employee directory is not configured");
    }
    return { baseUrl, apiKey, timeout };
  }

  private async request<T>(path: string, search?: URLSearchParams): Promise<EssaEnvelope<T>> {
    const { baseUrl, apiKey, timeout } = this.configuration();
    const url = new URL(`${baseUrl}${path}`);
    search?.forEach((value, key) => url.searchParams.append(key, value));

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json", "X-Api-Key": apiKey },
        signal: AbortSignal.timeout(timeout),
      });
      if (response.status === 404) {
        throw new ServiceUnavailableException("Employee directory endpoint is unavailable");
      }
      if (!response.ok) {
        throw new ServiceUnavailableException("Employee directory is temporarily unavailable");
      }
      const payload = await response.json() as EssaEnvelope<T>;
      if (payload.success === false || payload.data === undefined) {
        throw new ServiceUnavailableException("Employee directory returned an invalid response");
      }
      return payload;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException("Employee directory is temporarily unavailable");
    }
  }

  private normalize(employee: EssaEmployee): DirectoryEmployee {
    const EmployeeNo = employee.EmployeeNo?.trim();
    const EmployeeName = [employee.FirstName, employee.MiddleName, employee.LastName]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part))
      .join(" ");
    if (!EmployeeNo || !EmployeeName) {
      throw new ServiceUnavailableException("Employee directory returned an invalid employee record");
    }
    return {
      EmployeeNo,
      EmployeeName,
      DisplayLabel: `${EmployeeNo} - ${EmployeeName}`,
    };
  }

  async list(query: EmployeeDirectoryQueryDto) {
    const response = await this.request<EssaEmployee[]>("/v1/employee-management/option");
    const genericSearch = query.search?.trim().toLocaleLowerCase();
    const employeeNo = query.EmployeeNo?.trim().toLocaleLowerCase();
    const firstName = query.FirstName?.trim().toLocaleLowerCase();
    const lastName = query.LastName?.trim().toLocaleLowerCase();
    const filtered = (response.data ?? [])
      .filter((employee) => {
        const normalized = this.normalize(employee);
        return (!genericSearch || `${normalized.EmployeeNo} ${normalized.EmployeeName}`.toLocaleLowerCase().includes(genericSearch))
          && (!employeeNo || normalized.EmployeeNo.toLocaleLowerCase().includes(employeeNo))
          && (!firstName || employee.FirstName?.toLocaleLowerCase().includes(firstName))
          && (!lastName || employee.LastName?.toLocaleLowerCase().includes(lastName));
      })
      .map((employee) => this.normalize(employee));
    const sortBy = query.sortBy === "EmployeeName" ? "EmployeeName" : "EmployeeNo";
    const direction = query.sortOrder === "desc" ? -1 : 1;
    filtered.sort((left, right) => direction * left[sortBy].localeCompare(right[sortBy]));
    return {
      data: filtered,
    };
  }

  async resolveActive(employeeNo: string): Promise<DirectoryEmployee> {
    const normalizedEmployeeNo = employeeNo.trim();
    const response = await this.request<EssaEmployee[]>("/v1/employee-management/option");
    const employee = response.data?.find(
      (item) => item.EmployeeNo?.toLocaleLowerCase() === normalizedEmployeeNo.toLocaleLowerCase(),
    );
    if (!employee) throw new NotFoundException("Employee not found");
    return this.normalize(employee);
  }

  private normalizeDepartment(level: EssaLevel): DirectoryDepartment {
    const Code = level.LevelCode?.trim().toUpperCase();
    const Name = level.LevelName?.trim() || Code;
    if (!Code || !Name || String(level.LevelType) !== "3") {
      throw new ServiceUnavailableException("Employee directory returned an invalid department record");
    }
    return { Code, Name, DisplayLabel: `${Code} - ${Name}` };
  }

  async listDepartments(query: DepartmentDirectoryQueryDto) {
    const search = new URLSearchParams({ LevelType: "3" });
    const response = await this.request<EssaLevel[]>("/v1/master/level", search);
    const term = query.search?.trim().toLocaleLowerCase();
    const data = (response.data ?? [])
      .filter((level) => String(level.LevelType) === "3")
      .map((level) => this.normalizeDepartment(level))
      .filter((department) => !term || department.DisplayLabel.toLocaleLowerCase().includes(term))
      .sort((left, right) => left.Code.localeCompare(right.Code));
    return { data };
  }

  async resolveDepartment(code: string): Promise<DirectoryDepartment> {
    const normalizedCode = code.trim().toUpperCase();
    const response = await this.request<EssaLevel[]>("/v1/master/level", new URLSearchParams({ LevelType: "3" }));
    const level = response.data?.find(
      (item) => String(item.LevelType) === "3" && item.LevelCode?.trim().toUpperCase() === normalizedCode,
    );
    if (!level) throw new NotFoundException("Department not found");
    return this.normalizeDepartment(level);
  }
}
