import { NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmployeeDirectoryQueryDto } from "./employee-directory.dto";
import { EmployeeDirectoryService } from "./employee-directory.service";

describe("EmployeeDirectoryService", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function service(values: Record<string, string | undefined> = {}) {
    const config = {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;
    return new EmployeeDirectoryService(config);
  }

  it("uses only the ESSA option endpoint and returns every matching employee without pagination", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [{
          EmployeeNo: "E000001",
          FirstName: "Irfan",
          MiddleName: null,
          LastName: "Saputra",
          Salary: 999999,
        }],
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    const query = new EmployeeDirectoryQueryDto();
    query.search = "E000001";

    const result = await service({
      ESSA_API_URL: "https://essa.vuteq.co.id/connector/",
      ESSA_API_KEY: "server-secret",
      ESSA_API_TIMEOUT_MS: "5000",
    }).list(query);

    expect(result).toEqual({
      data: [{
        EmployeeNo: "E000001",
        EmployeeName: "Irfan Saputra",
        DisplayLabel: "E000001 - Irfan Saputra",
      }],
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe("https://essa.vuteq.co.id/connector/v1/employee-management/option");
    expect(url.search).toBe("");
    expect(init.headers).toEqual({ Accept: "application/json", "X-Api-Key": "server-secret" });
  });

  it("reports a missing ESSA option route as a dependency failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as unknown as typeof fetch;

    await expect(service({
      ESSA_API_URL: "https://essa.vuteq.co.id/connector",
      ESSA_API_KEY: "server-secret",
    }).list(new EmployeeDirectoryQueryDto())).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("resolves an assignment only from employees returned by the active option endpoint", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [{
          EmployeeNo: "E000002",
          FirstName: "Active",
          LastName: "Employee",
        }],
      }),
    }) as unknown as typeof fetch;

    await expect(service({
      ESSA_API_URL: "https://essa.vuteq.co.id/connector",
      ESSA_API_KEY: "server-secret",
    }).resolveActive("E000002")).resolves.toEqual({
      EmployeeNo: "E000002",
      EmployeeName: "Active Employee",
      DisplayLabel: "E000002 - Active Employee",
    });

    await expect(service({
      ESSA_API_URL: "https://essa.vuteq.co.id/connector",
      ESSA_API_KEY: "server-secret",
    }).resolveActive("E999999")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns only ESSA level type 3 departments and exposes their codes", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          { LevelType: "3", LevelCode: "it", LevelName: "Information Technology" },
          { LevelType: "4", LevelCode: "INF", LevelName: "Infrastructure" },
          { LevelType: "3", LevelCode: "hr", LevelName: "Human Resources" },
        ],
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await service({
      ESSA_API_URL: "https://essa.vuteq.co.id/connector/",
      ESSA_API_KEY: "server-secret",
    }).listDepartments({ search: "technology" });

    expect(result).toEqual({
      data: [{
        Code: "IT",
        Name: "Information Technology",
        DisplayLabel: "IT - Information Technology",
      }],
    });
    const [url] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe("https://essa.vuteq.co.id/connector/v1/master/level?LevelType=3");
  });

  it("fails closed when the server-only ESSA configuration is missing", async () => {
    await expect(service().list(new EmployeeDirectoryQueryDto()))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
