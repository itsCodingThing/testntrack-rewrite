import PermissionModel from "../../database/models/Permission.js";

export async function getPermissionsList() {
    const list = await PermissionModel.find({ deleted: false }).select("-deleted -created_by -updated_by").lean();
    return list;
}

export async function createNewPermission(body: $TSFixMe) {
    const permission = new PermissionModel({
        path: body.path,
        name: body.name,
        module: body.module,
        submodule: body.submodule,
        operation: body.operation,
        created_by: body.created_by,
    });

    await permission.save();

    return permission.toJSON();
}

export async function getPermissionById(id: $TSFixMe) {
    const permission = await PermissionModel.findById(id).select("-deleted -created_by -updated_by").lean();
    return permission;
}

export async function updatePermission({ id, update }: $TSFixMe) {
    await PermissionModel.findByIdAndUpdate(id, update);
}

export async function removePermission({ id, updated_by }: $TSFixMe) {
    await PermissionModel.findByIdAndUpdate(id, { deleted: true, updated_by });
}
