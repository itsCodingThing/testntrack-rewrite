import { randomInt } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, sep } from "node:path";
import url from "node:url";
import crypto from "node:crypto";
import { getUTCTimestamp } from "./date.js";
import { warn } from "node:console";

export const dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const storagePath = {
  image: resolve(dirname, `..${sep}..${sep}`, `data${sep}image`),
  pdf: resolve(dirname, `..${sep}..${sep}`, `data${sep}pdf`),
  audio: resolve(dirname, `..${sep}..${sep}`, `data${sep}audio`),
  docs: resolve(dirname, `..${sep}..${sep}`, `data${sep}docs`),
};

export const config = {
  jwt: {
    publicKey: "asldkfjaslkfjslqoietupreoifdghtyhrtueruytjht56h46r5h4e6r54h6er5t4hbsd65ga2sdf13as2f9as8d7f9adfaf",
    expiresIn: "7d",
  },
};

export function customObjectGroupBy<L, K extends keyof L>(list: L[], key: K) {
  const map = new Map();
  const arr: Array<[(typeof list)[number][typeof key], L[]]> = [];

  list.forEach((value) => {
    if (map.has(value[key])) {
      map.set(value[key], [...map.get(value[key]), value]);
    } else {
      map.set(value[key], [value]);
    }
  });

  map.forEach((value, key) => {
    arr.push([key, value]);
  });

  return arr;
}

export function getFilePathName(type: "image" | "pdf" | "audio") {
  const id = `${crypto.randomUUID()}-${getUTCTimestamp()}`;

  switch (type) {
    case "image": {
      if (!existsSync(storagePath.image)) {
        mkdirSync(storagePath.image, { recursive: true });
      }

      return { filename: resolve(storagePath.image, `${id}.jpeg`), fileId: id };
    }

    case "pdf": {
      if (!existsSync(storagePath.pdf)) {
        mkdirSync(storagePath.pdf, { recursive: true });
      }

      return { filename: resolve(storagePath.pdf, `${id}.pdf`), fileId: id };
    }

    case "audio": {
      if (!existsSync(storagePath.audio)) {
        mkdirSync(storagePath.audio, { recursive: true });
      }

      return { filename: resolve(storagePath.audio, `${id}.aac`), fileId: id };
    }

    default: {
      return null;
    }
  }
}

export function getFilePath({ type, id }: { type: "image" | "pdf" | "audio"; id: string }) {
  switch (type) {
    case "image": {
      return `${storagePath.image}${sep}${id}.jpeg`;
    }

    case "pdf": {
      return `${storagePath.pdf}${sep}${id}.pdf`;
    }

    case "audio": {
      return `${storagePath.audio}${sep}${id}.aac`;
    }

    default:
      return null;
  }
}

export function genRandom4DigitInt() {
  return randomInt(1000, 10000);
}
