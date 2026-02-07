import {
  nextCookiesMock,
  nextHeadersMock,
  nodemailerMock,
  redisMock,
  resendMock,
  resetExternalMocks,
  sanitizeHtmlMock,
  sendGridMock,
} from "./external";

describe("external mocks", () => {
  it("resetExternalMocks clears all mock call counts", () => {
    // trigger mocks
    redisMock();
    nodemailerMock.createTransport();
    sendGridMock.setApiKey();
    sendGridMock.send();
    resendMock.Resend();
    sanitizeHtmlMock("test");
    nextHeadersMock.headers();
    nextHeadersMock.cookies();
    nextCookiesMock.cookies();

    resetExternalMocks();

    expect(redisMock).toHaveBeenCalledTimes(0);
    expect(nodemailerMock.createTransport).toHaveBeenCalledTimes(0);
    expect(sendGridMock.setApiKey).toHaveBeenCalledTimes(0);
    expect(sendGridMock.send).toHaveBeenCalledTimes(0);
    expect(resendMock.Resend).toHaveBeenCalledTimes(0);
    expect(sanitizeHtmlMock).toHaveBeenCalledTimes(0);
    expect(nextHeadersMock.headers).toHaveBeenCalledTimes(0);
    expect(nextHeadersMock.cookies).toHaveBeenCalledTimes(0);
    expect(nextCookiesMock.cookies).toHaveBeenCalledTimes(0);
  });
});
