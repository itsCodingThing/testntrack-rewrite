export default {
  server: {
    host: "0.0.0.0",
    port: 8080,
    devPort: 2020,
  },
  jwt: {
    publicKey:
      "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDRry8T/ef/FM51TBe0/Qs16pPAKlA6oncQRZbIdzmGOxH0H7PwDDOEe90k2JLkiO0CifofkV08m4nZ6EIH6slwdRtZKkRP6FfnRZcirtPpAWcpGDuKrKS5XGxIsrzD6vlnm6D2rvxrcnCDt6e8TSx5vFkbG9Emb6DmoFqcn+2MSQIDAQAB",
    issuer: "REPLACE_NAME Services",
    subject: "REPLACE_NAME Api",
    audience: "REPLACE_NAME",
    expiresIn: "30d",
  },
  auth: {
    username: "AdminExamkul",
    password: "Examkul@123",
  },
  mongodb: {
    db: "testntrack",
    atlasConnectionString: "",
    atlasUsername: "Examkul",
    atlasPassword: "Examkul@2020",
    connectionString: "mongodb://172.18.0.2:27017",
    password: "",
    username: "",
  },
  encrypt: {
    salt: "DYhG93b0qyJfIxfs2guVoUubWwvniR2G0Fgamuni",
    algorithm: "sha1",
    digest: "hex",
    publicKey: "",
    privateKey: "",
  },
  mail_server: {
    host: "",
    port: "465",
    sender_mail: "",
    username: "",
    password: "",
    from: "",
  },
  bulksms: {
    url: "",
    user_id: "examkul",
    password: "hRTRAkWT",
    sender_id: "EXMKUL",
  },
  sentry_dsn: "",
};
