import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { encryptPassword } from "../encrypt";
const prisma = new PrismaClient();

console.log("fake admins creating");
const adminUsers = Array.from({ length: 1000 }, () => {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    contact: faker.phone.number(),
    password: encryptPassword("password"),
    created_at: faker.date.past(),
  };
});
console.log("fake admins created");

async function main() {
  console.log("seeding database");

  console.log("adding admin users in database");
  await prisma.adminUser.createMany({
    data: adminUsers,
    skipDuplicates: true,
  });
  console.log("added admin users in database");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
