import { pageMeta } from "./pagination.dto";
describe("pageMeta", () => { it("computes total pages", () => expect(pageMeta(2, 50, 101)).toEqual({ page: 2, limit: 50, totalItems: 101, totalPages: 3 })); });
