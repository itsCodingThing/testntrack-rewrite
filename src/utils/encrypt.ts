import bcryptjs from "bcryptjs";

export function encryptPassword(password: string) {
    const salt = bcryptjs.genSaltSync();
    const hash = bcryptjs.hashSync(password, salt);

    return hash;
}

export function compareHashPassword(password: string, hashPassword: string) {
    return bcryptjs.compareSync(password, hashPassword);
}
