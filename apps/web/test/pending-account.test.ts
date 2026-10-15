import { describe, expect, it } from "vitest";
import PendingAccountPage from "@/app/auth/pending-account/page";
import SsoErrorPage from "@/app/auth/error/page";

describe("PendingAccountPage & SsoErrorPage", () => {
  it("renders pending-account page with info status, title, and logout action", () => {
    const vnode = PendingAccountPage();
    expect(vnode).toBeDefined();
    expect(vnode.props.className).toContain("flex min-h-screen items-center justify-center bg-slate-50 p-6");
    const result = vnode.props.children;
    expect(result.props.status).toBe("info");
    expect(result.props.title).toBe("Account approval pending");
    expect(result.props.subTitle).toContain("Your Vuteq identity is linked to ITAM");
    expect(result.props.subTitle).toContain("administrator must assign your local role before you can continue");
    const form = result.props.extra;
    expect(form.props.action).toBe("/it-asset/auth/logout");
    expect(form.props.method).toBe("post");
    const button = form.props.children;
    expect(button.props.htmlType).toBe("submit");
    expect(button.props.children).toBe("Sign out");
  });

  it("renders error page with error status, title, and try again link", () => {
    const vnode = SsoErrorPage();
    expect(vnode).toBeDefined();
    expect(vnode.props.className).toContain("flex min-h-screen items-center justify-center bg-slate-50 p-6");
    const result = vnode.props.children;
    expect(result.props.status).toBe("error");
    expect(result.props.title).toBe("Sign-in failed");
    expect(result.props.subTitle).toContain("ITAM could not complete your Vuteq SSO sign-in");
    const button = result.props.extra;
    expect(button.props.type).toBe("primary");
    expect(button.props.href).toBe("/it-asset/auth/login");
    expect(button.props.children).toBe("Try again");
  });
});
