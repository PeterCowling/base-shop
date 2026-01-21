import { jest } from "@jest/globals";

import * as service from "../../services/blog";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  publishPost,
  unpublishPost,
  updatePost,
} from "../blog.server";

jest.mock("../../services/blog", () => ({
  getPosts: jest.fn(),
  getPost: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  publishPost: jest.fn(),
  unpublishPost: jest.fn(),
  deletePost: jest.fn(),
}));

describe("blog.server actions", () => {
  const fd = new FormData();
  const post = { id: "1" };

  const cases: Array<{
    name: string;
    action: (...args: any[]) => Promise<any>;
    serviceFn: jest.Mock;
    args: any[];
    result: any;
    serviceArgs?: any[];
  }> = [
    {
      name: "getPosts",
      action: getPosts,
      serviceFn: service.getPosts as jest.Mock,
      args: ["shop"],
      serviceArgs: ["shop"],
      result: [post],
    },
    {
      name: "getPost",
      action: getPost,
      serviceFn: service.getPost as jest.Mock,
      args: ["shop", "1"],
      serviceArgs: ["shop", "1"],
      result: post,
    },
    {
      name: "createPost",
      action: createPost,
      serviceFn: service.createPost as jest.Mock,
      args: ["shop", undefined, fd],
      serviceArgs: ["shop", fd],
      result: { message: "ok", id: "1" },
    },
    {
      name: "updatePost",
      action: updatePost,
      serviceFn: service.updatePost as jest.Mock,
      args: ["shop", undefined, fd],
      serviceArgs: ["shop", fd],
      result: { message: "ok" },
    },
    {
      name: "publishPost",
      action: publishPost,
      serviceFn: service.publishPost as jest.Mock,
      args: ["shop", "1", undefined, fd],
      serviceArgs: ["shop", "1", fd],
      result: { message: "ok" },
    },
    {
      name: "unpublishPost",
      action: unpublishPost,
      serviceFn: service.unpublishPost as jest.Mock,
      args: ["shop", "1"],
      serviceArgs: ["shop", "1"],
      result: { message: "ok" },
    },
    {
      name: "deletePost",
      action: deletePost,
      serviceFn: service.deletePost as jest.Mock,
      args: ["shop", "1"],
      serviceArgs: ["shop", "1"],
      result: { message: "ok" },
    },
  ];

  describe.each(cases)('%s', ({ name, action, serviceFn, args, result, serviceArgs }) => {
    afterEach(() => jest.clearAllMocks());

    test("forwards to service", async () => {
      serviceFn.mockResolvedValue(result);
      const res = await action(...args);
      expect(serviceFn).toHaveBeenCalledWith(...(serviceArgs ?? args));
      expect(res).toBe(result);
    });

    test("propagates errors", async () => {
      serviceFn.mockRejectedValue(new Error("fail"));
      await expect(action(...args)).rejects.toThrow("fail");
    });
  });
});

