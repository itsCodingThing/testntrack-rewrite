import RoleModel from "../../database/models/Role.js";

async function getRolesList() {
    const list = await RoleModel.find({ deleted: false }).lean({ autopopulate: true });

    return list;
}

async function addNewRole(body: $TSFixMe) {
    const role = new RoleModel(body);

    await role.save();

    return role.toJSON();
}

async function updateRoleById({ id, update }: $TSFixMe) {
    await RoleModel.findByIdAndUpdate(id, update);
}

export default {
    getRolesList,
    addNewRole,
    updateRoleById,
};
