"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revalidate = void 0;
exports.default = RbacPage;
// apps/cms/src/app/cms/rbac/page.tsx
var shadcn_1 = require("@/components/atoms/shadcn");
var rbac_server_1 = require("@cms/actions/rbac.server");
var options_1 = require("@cms/auth/options");
var next_auth_1 = require("next-auth");
var link_1 = require("next/link");
var navigation_1 = require("next/navigation");
exports.revalidate = 0;
function RbacPage() {
    return __awaiter(this, void 0, void 0, function () {
        function save(formData) {
            return __awaiter(this, void 0, void 0, function () {
                "use server";
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, rbac_server_1.updateUserRoles)(formData)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        function invite(formData) {
            return __awaiter(this, void 0, void 0, function () {
                "use server";
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, rbac_server_1.inviteUser)(formData)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        var session, users, roles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, next_auth_1.getServerSession)(options_1.authOptions)];
                case 1:
                    session = _a.sent();
                    if ((session === null || session === void 0 ? void 0 : session.user.role) !== "admin") {
                        (0, navigation_1.redirect)("/cms");
                    }
                    return [4 /*yield*/, (0, rbac_server_1.listUsers)()];
                case 2:
                    users = _a.sent();
                    roles = [
                        "admin",
                        "viewer",
                        "ShopAdmin",
                        "CatalogManager",
                        "ThemeEditor",
                    ];
                    return [2 /*return*/, (<div>
      <h2 className="mb-4 text-xl font-semibold">User Roles</h2>
      <p className="mb-4 text-sm">
        See the
        <link_1.default href="/doc/permissions.md" target="_blank" rel="noreferrer" className="underline">
          permission guide
        </link_1.default>
        for default role mappings.
      </p>
      {users.map(function (u) { return (<form key={u.id} action={save} className="mb-4 rounded border p-3">
          <input type="hidden" name="id" value={u.id}/>
          <p>
            <b>{u.name}</b> ({u.email})
          </p>
          <div className="my-2 flex flex-wrap gap-2">
            {roles.map(function (role) { return (<label key={role} className="flex items-center gap-1 text-sm">
                <input type="checkbox" name="roles" value={role} defaultChecked={Array.isArray(u.roles)
                                        ? u.roles.includes(role)
                                        : u.roles === role}/>
                {role}
              </label>); })}
          </div>
          <shadcn_1.Button type="submit">Save</shadcn_1.Button>
        </form>); })}

      <h3 className="mt-8 text-lg font-semibold">Invite User</h3>
      <form action={invite} className="mt-2 space-y-2 rounded border p-3">
        <label className="block text-sm">
          <span>Name</span>
          <shadcn_1.Input name="name" className="mt-1"/>
        </label>
        <label className="block text-sm">
          <span>Email</span>
          <shadcn_1.Input type="email" name="email" className="mt-1"/>
        </label>
        <label className="block text-sm">
          <span>Password</span>
          <shadcn_1.Input type="password" name="password" className="mt-1"/>
        </label>
        <div className="flex flex-wrap gap-2">
          {roles.map(function (role) { return (<label key={role} className="flex items-center gap-1 text-sm">
              <input type="checkbox" name="roles" value={role}/> {role}
            </label>); })}
        </div>
        <shadcn_1.Button type="submit">Invite</shadcn_1.Button>
      </form>
    </div>)];
            }
        });
    });
}
