import { sendErrorResponse } from "../utils/serverResponse.js";
import { findSchoolAdminUserDetails } from "../services/db/schoolAdminUser.js";

const PERM_ROUTE = ["school/admin", "school/batch", "school/paper", "school/teacher"];

export default async (req: $TSFixMe, res: $TSFixMe) => {
    const currentUserId = req.payload.id;
    const url = req.url;

    if (!PERM_ROUTE.some((r) => url.toLowerCase().includes(r))) {
        return;
    }

    const user = await findSchoolAdminUserDetails(currentUserId);

    // const routes = user.roles.reduce((prev, curr) => {
    //     const paths = curr.permissions.map((value) => value.path);
    //     return [...prev, ...paths];
    // }, []);

    if (!user) {
        return sendErrorResponse({
            code: 401,
            msg: "Unauthorized",
            response: res,
        });
    }
};
