import ActionModel from "../../../database/models/b2c/Actions.js";

export type TActionType = "banners" | "nav_actions";

export async function addAction(data: $TSFixMe, type: TActionType) {
    if (type === "banners") {
        const model = await ActionModel.findOneAndUpdate(
            {},
            {
                $push: {
                    banners: data,
                },
            },
            { upsert: true, returnDocument: "after" }
        ).lean();

        return model.banners;
    }

    if (type === "nav_actions") {
        const model = await ActionModel.findOneAndUpdate(
            {},
            {
                $push: {
                    nav_actions: data,
                },
            },
            { upsert: true, returnDocument: "after" }
        ).lean();

        return model.nav_actions;
    }
}

export async function removeAction(id: $TSFixMe, type: TActionType) {
    if (type === "banners") {
        const model = await ActionModel.findOneAndUpdate(
            {},
            {
                $pull: { banners: { _id: id } },
            },
            { upsert: true, returnDocument: "after" }
        );

        return model.banners;
    }

    if (type === "nav_actions") {
        const model = await ActionModel.findOneAndUpdate(
            {},
            {
                $pull: { nav_actions: { _id: id } },
            },
            { upsert: true, returnDocument: "after" }
        );

        return model.nav_actions;
    }
}

export async function getActions(type: TActionType) {
    const model = await ActionModel.findOne({}).lean();

    if (type === "banners") {
        return model?.banners ?? [];
    }

    if (type === "nav_actions") {
        return model?.nav_actions ?? [];
    }
}
