import { type FastifyPluginAsync } from "fastify";

export const otherRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route   GET "/.well-known/assetlinks.json"
     * @desc    api domain verify for app link redirect
     */
    fastify.route({
        method: "GET",
        url: "/.well-known/assetlinks.json",
        handler: async () => {
            return [
                {
                    relation: ["delegate_permission/common.handle_all_urls"],
                    target: {
                        namespace: "android_app",
                        package_name: "com.test_n_prep",
                        sha256_cert_fingerprints: [
                            "35:B3:9C:1B:1D:A6:B5:7B:2C:A9:57:A6:43:DA:79:0E:08:32:B4:B7:A8:C7:80:1D:6F:B5:F9:77:D7:EF:31:E3",
                            "B3:5E:84:5C:A9:F3:52:30:24:06:8B:FF:D6:B1:AD:AB:91:E1:A6:70:5B:D1:74:B8:36:9B:51:28:8A:B8:68:7D",
                        ],
                    },
                },
            ];
        },
    });

    /**
     * @route   GET "/sentry-debug"
     * @desc    debug sentry error
     */
    fastify.route({
        method: "GET",
        url: "/sentry-debug",
        handler: async () => {
            const paperId = "631d478b0b8e329203f59450";
            return paperId;
        },
    });
};
