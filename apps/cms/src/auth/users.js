// apps/cms/src/auth/users.ts
/** Phase-0 in-memory users (replace with DB in Phase-1). */
export const USERS = {
  admin: {
    id: "1",
    name: "Admin",
    email: "admin@example.com",
    //password: "admin",
    password: "admin", // NOTE: stored in plain text
  },
  viewer: {
    id: "2",
    name: "Viewer",
    email: "viewer@example.com",
    //password: "viewer",
    password:
      "$argon2id$v=19$m=65536,t=3,p=4$EJTukba6cgu3oddf7NWibw$925GwzuYHM9wGz+R+j8TDed1jF1sllCqEOyQ63g5Iw4",
  },
  shopAdmin: {
    id: "3",
    name: "Shop Admin",
    email: "shopadmin@example.com",
    //password: "shopadmin",
    password:
      "$argon2id$v=19$m=65536,t=3,p=4$Qzzwz9iLHAK1XFp0gY8CaA$mRWqHTICaS4hB/E7TheLtyQjbmvzN2QKVuz0NnCKr+w",
  },
  catalogManager: {
    id: "4",
    name: "Catalog Manager",
    email: "catalogmanager@example.com",
    //password: "catalogmanager",
    password:
      "$argon2id$v=19$m=65536,t=3,p=4$1ie22pUv+lwFEJcQy15tHg$zJRHh2i3T5UpBpO0ffpDSnQbRpDwWh5bTqbCgLq22JE",
  },
  themeEditor: {
    id: "5",
    name: "Theme Editor",
    email: "themeeditor@example.com",
    //password: "themeeditor",
    password:
      "$argon2id$v=19$m=65536,t=3,p=4$XCickdgFmjP4faHZ2TCafA$x/vBXe/eGRdl3IgI1fNbb9RBXhOGpUGkJPsHbmV98Bw",
  },
};
