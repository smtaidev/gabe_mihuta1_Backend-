import { UserRole } from "@prisma/client";
import prisma from "./app/utils/prisma";
import hashPassword from "./app/helpers/hashPassword";
 
const seedSuperAdmin = async () => {
  try {
    const isExistSuperAdmin = await prisma.user.findFirst({
      where: {
        role: UserRole.SUPER_ADMIN,
      },
    });
 
    if (isExistSuperAdmin) {
      return;
    }
 
    const password = await hashPassword("superadmin");
 
    await prisma.user.create({
      data: {
        fullName: "Super Admin",
        email: "super@admin.com",
        password: password,
        role: UserRole.SUPER_ADMIN,
      },
    });
    console.log("Creating Super Admin with role:", UserRole.SUPER_ADMIN);
 
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
};

export default seedSuperAdmin;