import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { encryptPassword } from "../encrypt";
const prisma = new PrismaClient();

console.log("fake schools creating");
const schoolData = Array.from({ length: 100 }, () => {
  const name = faker.person.firstName();
  const school = {
    name: `${name}-school`,
    email: faker.internet.email(),
    contact: faker.phone.number(),
    code: faker.finance.pin(5),
    type: "school",
  };

  return {
    name: school.name,
    email: school.email,
    contact: school.contact,
    code: school.code,
    type: school.type,
    schoolAdminUser: {
      create: {
        name: `${name} school admin`,
        email: school.email,
        password: encryptPassword("password"),
        contact: school.contact,
      },
    },
    schoolDetails: {
      create: {},
    },
  };
});
console.log("fake schools created");

async function main() {
  console.log("seeding database");

  console.log("adding schools in database");
  for (const v of schoolData) {
    await prisma.school.create({
      data: v,
    });
  }
  console.log("added schools in database");
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
