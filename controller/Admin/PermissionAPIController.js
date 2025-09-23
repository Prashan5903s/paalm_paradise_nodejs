const mongoose = require('mongoose');
const validation = require('../../util/validation')
const user = require('../../model/User')
const RoleUser = require('../../model/RoleUser')
const packageType = require('../../model/PackageType')
const PermissionModule = require('../../model/PermissionModule');
const { errorResponse, successResponse } = require("../../util/response");
const Role = require('../../model/Role');

exports.getPermission = async (req, res, next) => {
    const userId = req.userId?.toString();

    try {
        // Get all permission modules including permission and name
        const allPermissionModules = await PermissionModule.find(
            {
                $or: [
                    { created_by: userId },
                    { 'permission.0': { $exists: true } }
                ]
            },
            { permission: 1, name: 1, created_by: 1 }
        ).lean();

        if (!allPermissionModules || allPermissionModules.length === 0) {
            const error = new Error("Permission modules do not exist!");
            error.statusCode = 404;
            throw error;
        }

        const permissionMap = new Map();

        allPermissionModules.forEach((module) => {
            const moduleId = module._id.toString();
            const moduleName = module.name || '';
            const createdBy = module.created_by?.toString();

            module.permission?.forEach((perm, index) => {
                const permId = perm._id.toString();

                if (!permissionMap.has(permId)) {
                    permissionMap.set(permId, {
                        ...perm,
                        index,
                        permission_module_ids: [moduleId],
                        permission_module_names: [moduleName],
                        created_by_list: [createdBy],
                    });
                } else {
                    const existing = permissionMap.get(permId);
                    existing.permission_module_ids.push(moduleId);
                    existing.permission_module_names.push(moduleName);
                    existing.created_by_list.push(createdBy);
                }
            });
        });

        const allPermission = [];
        const totalPermission = [];

        for (const [_, value] of permissionMap.entries()) {
            const finalPerm = {
                ...value,
                permission_module_names: value.permission_module_names.join(', '),
            };

            // If any of the modules for this permission were created by the current user
            const isUserCreated = value.created_by_list.some(creatorId => creatorId === userId);

            if (isUserCreated) {
                allPermission.push(finalPerm);
            }

            totalPermission.push(finalPerm);
        }

        res.status(200).json({
            status: "Success",
            statusCode: 200,
            message: "Data fetched successfully",
            data: {
                allPermission,
                totalPermission,
            },
        });

    } catch (error) {
        next(error);
    }
};

exports.createPermission = async (req, res, next) => {
    const userId = req.userId;

    const formData = await PermissionModule.find({ created_by: userId });

    if (!formData) {
        const error = new Error("Permission module data does not exist")
        error.statusCode = 404;
        throw error;
    }

    res.status(200).json({
        status: "Success",
        statusCode: 200,
        message: "Data fetched successfully!",
        data: formData
    });

};

const slugify = (text) =>
    text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
        .replace(/\s+/g, '-')        // Replace spaces with -
        .replace(/-+/g, '-');        // Collapse multiple -

exports.editPermission = async (req, res, next) => {
    const permissionId = req.params.permissionId;

    try {
        // Find all permission modules where the permission exists
        const matchedModules = await PermissionModule.find({
            'permission._id': permissionId
        });

        if (!matchedModules.length) {
            const error = new Error("Permission not found in any module.");
            error.statusCode = 404;
            throw error;
        }

        // Get the matching permission from the first module
        const firstPermission = matchedModules[0].permission.find(
            (perm) => perm._id.toString() === permissionId
        );

        if (!firstPermission) {
            const error = new Error("Permission data inconsistent.");
            error.statusCode = 500;
            throw error;
        }

        // Collect all module IDs that have this permission
        const permissionModuleIds = matchedModules.map(mod => mod._id.toString());

        res.status(200).json({
            status: "Success",
            statusCode: 200,
            message: "Permission data fetched successfully",
            data: {
                ...firstPermission.toObject(),
                permission_module_id: permissionModuleIds
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.postPermission = async (req, res, next) => {
    if (!validation(req, res)) return;

    const { name, status, permissionmodule } = req.body;
    const userId = req.userId;

    try {
        if (!Array.isArray(permissionmodule) || permissionmodule.length === 0) {
            const error = new Error("At least one permission module is required.");
            error.statusCode = 400;
            throw error;
        }

        const slug = slugify(name);
        const sharedPermissionId = new mongoose.Types.ObjectId();

        for (const moduleId of permissionmodule) {
            const moduleDoc = await PermissionModule.findOne({
                _id: moduleId,
                created_by: userId
            });

            if (!moduleDoc) {
                const error = new Error(`Permission module with ID ${moduleId} does not exist.`);
                error.statusCode = 404;
                throw error;
            }

            // Skip if permission with same _id already exists
            const alreadyExists = moduleDoc.permission.some(
                (perm) => perm._id.equals(sharedPermissionId)
            );

            if (alreadyExists) continue;

            const newPermissionItem = {
                _id: sharedPermissionId,
                name,
                status,
                slug,
                created_by: userId,
            };

            await moduleDoc.addPermission(newPermissionItem);
        }

        return res.status(200).json({
            status: "Success",
            statusCode: 200,
            message: "Permissions added successfully",
        });

    } catch (error) {
        next(error);
    }
};

exports.putPermission = async (req, res, next) => {
    const userId = req.userId;
    const permissionId = req.params.permissionId;
    const { name, status, permissionmodule } = req.body;

    try {
        // Step 1: Remove the permission from all permission modules
        await PermissionModule.updateMany(
            {},
            { $pull: { permission: { _id: permissionId } } }
        );

        // Step 2: Prepare the permission object to insert
        const newPermission = {
            _id: permissionId, // re-using the same _id
            name,
            slug: slugify(name),
            status,
            created_by: userId
        };

        // Step 3: Add it to the selected permission modules
        const updateOps = permissionmodule.map(moduleId => (
            PermissionModule.updateOne(
                { _id: moduleId },
                { $push: { permission: newPermission } }
            )
        ));

        await Promise.all(updateOps);

        res.status(200).json({
            status: "Success",
            statusCode: 200,
            message: "Permission updated across selected modules",
        });

    } catch (error) {
        next(error);
    }
};

const normalizeToArray = (data) => {
    if (!data) return [];
    if (typeof data === 'string') return [data];
    if (Array.isArray(data)) return data.flat(Infinity).map(String);
    if (typeof data === 'object') return Object.values(data).flat(Infinity).map(String);
    return [];
};

exports.getPermAllowAPI = async (req, res, next) => {
    try {
        const userId = req.userId;

        const listing = '68cd0c88c2d476bd45382e0d';
        const edit = '68bc229cab2e24f55ea586fa';
        const status = "68cd0a88ce94fc785bb601c8"
        const add = '68bc227eab2e24f55ea586ef';
        const invoice = '68cd0c5fc2d476bd45382c6a';
        const record_view = "68cd0cecc2d476bd45383621"

        const superAdminId = '68bc14b6b297142d6bfe639c';
        const ticketId = "68d22d6718430e2129859697";
        const role = '68cd0cb3c2d476bd453831ef';
        const apartment = '68cd0b51ce94fc785bb63192';
        const tower = '68cd0b44ce94fc785bb63184';
        const users = '68bc226cab2e24f55ea586e7';
        const billing = '68cd0742ce94fc785bb5fe75';
        const visitor = '68cd07c8ce94fc785bb5fe83';
        const complain = '68cd07f2ce94fc785bb5fe8a';
        const floor = '68cd0b3dce94fc785bb63176';
        const camera = '68cd3f185ab9c7e035f4cb04'

        let isSuperAdmin = false;
        let isCompany = false;
        let isUser = false;
        let notUser = true;

        const permissionsStatus = {

            hasTowerPermission: false,
            hasTowerAddPermission: false,
            hasTowerEditPermission: false,

            hasFlatPermission: false,
            hasFlatAddPermission: false,
            hasFlatEditPermission: false,

            hasApartmentPermission: false,
            hasApartmentAddPermission: false,
            hasApartmentEditPermission: false,

            hasUserPermission: false,
            hasUserStatusPermission: false,
            hasUserAddPermission: false,
            hasUserEditPermission: false,

            hasBillingPermission: false,
            hasBillingAddPermission: false,
            hasBillingEditPermission: false,
            hasBillingInvoicePermission: false,
            hasBillingViewPermission: false,

            hasComplainPermission: false,
            hasComplainAddPermission: false,
            hasComplainEditPermission: false,
            hasComplainRecordViewPermission: false,

            hasVisitorPermission: false,
            hasVisitorAddPermission: false,
            hasVisitorEditPermission: false,

            hasRolePermission: false,
            hasRoleAddPermission: false,
            hasRoleEditPermission: false,

            hasCameraPermission: false,

            hasTicketPermission: false,

        };

        // If super admin, all permissions default to false (can be changed if needed)
        if (userId?.toString().trim() === superAdminId) {
            isSuperAdmin = true;
        } else {
            const User = await user.findById(userId);

            if (!User) {
                return errorResponse(res, "User does not exist", {}, 404);
            }

            const masterId = User.created_by?.toString().trim();

            if (masterId === superAdminId) {
                isCompany = true;

                const packageId = User.package_id;


                if (packageId) {

                    if (!mongoose.Types.ObjectId.isValid(packageId)) {
                        return errorResponse(res, "Invalid package ID", {}, 400);
                    }

                    const packageTypeDoc = await packageType.findOne({
                        'package.items._id': new mongoose.Types.ObjectId(packageId)
                    }).lean();

                    if (!packageTypeDoc) {
                        return errorResponse(res, 'Package type does not exist', {}, 404);
                    }

                    const matchedItem = packageTypeDoc.package.items.find(item =>
                        item._id.toString() === packageId.toString()
                    );

                    if (!matchedItem) {
                        return errorResponse(res, 'Package does not exist', {}, 404);
                    }

                    const permission = matchedItem.permissions || {};

                    permissionsStatus.hasTowerPermission = normalizeToArray(permission[tower]).includes(listing);
                    permissionsStatus.hasTowerAddPermission = normalizeToArray(permission[tower]).includes(add);
                    permissionsStatus.hasTowerEditPermission = normalizeToArray(permission[tower]).includes(edit)

                    permissionsStatus.hasFloorPermission = normalizeToArray(permission[floor]).includes(listing);
                    permissionsStatus.hasFloorAddPermission = normalizeToArray(permission[floor]).includes(add)
                    permissionsStatus.hasFloorEditPermission = normalizeToArray(permission[floor]).includes(edit)

                    permissionsStatus.hasApartmentPermission = normalizeToArray(permission[apartment]).includes(listing);
                    permissionsStatus.hasApartmentAddPermission = normalizeToArray(permission[apartment]).includes(add);
                    permissionsStatus.hasApartmentEditPermission = normalizeToArray(permission[apartment]).includes(edit);

                    permissionsStatus.hasUserPermission = normalizeToArray(permission[users]).includes(listing);
                    permissionsStatus.hasUserAddPermission = normalizeToArray(permission[users]).includes(add)
                    permissionsStatus.hasUserEditPermission = normalizeToArray(permission[users]).includes(edit)
                    permissionsStatus.hasUserStatusPermission = normalizeToArray(permission[users]).includes(status);

                    permissionsStatus.hasBillingPermission = normalizeToArray(permission[billing]).includes(listing);
                    permissionsStatus.hasBillingAddPermission = normalizeToArray(permission[billing]).includes(add)
                    permissionsStatus.hasBillingEditPermission = normalizeToArray(permission[billing]).includes(edit)
                    permissionsStatus.hasBillingInvoicePermission = normalizeToArray(permission[billing]).includes(invoice)
                    permissionsStatus.hasBillingViewPermission = normalizeToArray(permission[billing]).includes(record_view)

                    permissionsStatus.hasComplainPermission = normalizeToArray(permission[complain]).includes(listing);
                    permissionsStatus.hasComplainAddPermission = normalizeToArray(permission[complain]).includes(add)
                    permissionsStatus.hasComplainEditPermission = normalizeToArray(permission[complain]).includes(edit)
                    permissionsStatus.hasComplainRecordViewPermission = normalizeToArray(permission[complain]).includes(record_view)

                    permissionsStatus.hasVisitorPermission = normalizeToArray(permission[visitor]).includes(listing)
                    permissionsStatus.hasVisitorAddPermission = normalizeToArray(permission[visitor]).includes(add)
                    permissionsStatus.hasVisitorEditPermission = normalizeToArray(permission[visitor]).includes(edit)

                    permissionsStatus.hasRolePermission = normalizeToArray(permission[role]).includes(listing)
                    permissionsStatus.hasRoleAddPermission = normalizeToArray(permission[role]).includes(add)
                    permissionsStatus.hasRoleEditPermission = normalizeToArray(permission[role]).includes(edit)

                    permissionsStatus.hasTicketPermission = normalizeToArray(permission[ticketId]).includes(listing);

                }
            } else {
                const roles = await RoleUser.find({ user_id: userId }).select("role_id");

                const roleIds = roles.map(r => r.role_id);

                const roleDocs = await Role.find({ _id: { $in: roleIds } }).lean();

                // merged permissions object
                const mergedPermissions = {};

                for (const role of roleDocs) {
                    if (!role.permissions) continue;

                    // iterate object instead of Map
                    for (const [key, values] of Object.entries(role.permissions)) {
                        if (!mergedPermissions[key]) {
                            mergedPermissions[key] = new Set();
                        }

                        values.forEach(v => mergedPermissions[key].add(v.toString())); // ensure uniqueness
                    }
                }

                // convert sets back to arrays
                const finalPermissions = {};
                for (const key in mergedPermissions) {
                    finalPermissions[key] = Array.from(mergedPermissions[key]);
                }

                permissionsStatus.hasTowerPermission = normalizeToArray(finalPermissions[tower]).includes(listing);
                permissionsStatus.hasTowerAddPermission = normalizeToArray(finalPermissions[tower]).includes(add);
                permissionsStatus.hasTowerEditPermission = normalizeToArray(finalPermissions[tower]).includes(edit)

                permissionsStatus.hasFloorPermission = normalizeToArray(finalPermissions[floor]).includes(listing);
                permissionsStatus.hasFloorAddPermission = normalizeToArray(finalPermissions[floor]).includes(add)
                permissionsStatus.hasFloorEditPermission = normalizeToArray(finalPermissions[floor]).includes(edit)

                permissionsStatus.hasApartmentPermission = normalizeToArray(finalPermissions[apartment]).includes(listing);
                permissionsStatus.hasApartmentAddPermission = normalizeToArray(finalPermissions[apartment]).includes(add);
                permissionsStatus.hasApartmentEditPermission = normalizeToArray(finalPermissions[apartment]).includes(edit);

                permissionsStatus.hasUserPermission = normalizeToArray(finalPermissions[users]).includes(listing);
                permissionsStatus.hasUserAddPermission = normalizeToArray(finalPermissions[users]).includes(add)
                permissionsStatus.hasUserEditPermission = normalizeToArray(finalPermissions[users]).includes(edit)
                permissionsStatus.hasUserStatusPermission = normalizeToArray(finalPermissions[users]).includes(status);

                permissionsStatus.hasBillingPermission = normalizeToArray(finalPermissions[billing]).includes(listing);
                permissionsStatus.hasBillingAddPermission = normalizeToArray(finalPermissions[billing]).includes(add)
                permissionsStatus.hasBillingEditPermission = normalizeToArray(finalPermissions[billing]).includes(edit)
                permissionsStatus.hasBillingInvoicePermission = normalizeToArray(finalPermissions[billing]).includes(invoice)
                permissionsStatus.hasBillingViewPermission = normalizeToArray(finalPermissions[billing]).includes(record_view)

                permissionsStatus.hasComplainPermission = normalizeToArray(finalPermissions[complain]).includes(listing);
                permissionsStatus.hasComplainAddPermission = normalizeToArray(finalPermissions[complain]).includes(add)
                permissionsStatus.hasComplainEditPermission = normalizeToArray(finalPermissions[complain]).includes(edit)
                permissionsStatus.hasComplainRecordViewPermission = normalizeToArray(finalPermissions[complain]).includes(record_view)

                permissionsStatus.hasVisitorPermission = normalizeToArray(finalPermissions[visitor]).includes(listing)
                permissionsStatus.hasVisitorAddPermission = normalizeToArray(finalPermissions[visitor]).includes(add)
                permissionsStatus.hasVisitorEditPermission = normalizeToArray(finalPermissions[visitor]).includes(edit)

                permissionsStatus.hasRolePermission = normalizeToArray(finalPermissions[role]).includes(listing)
                permissionsStatus.hasRoleAddPermission = normalizeToArray(finalPermissions[role]).includes(add)
                permissionsStatus.hasRoleEditPermission = normalizeToArray(finalPermissions[role]).includes(edit)

                permissionsStatus.hasCameraPermission = normalizeToArray(finalPermissions[camera]).includes(listing)

                permissionsStatus.hasTicketPermission = normalizeToArray(finalPermissions[ticketId]).includes(listing);

                isUser = true;
                notUser = false;
            }
        }

        const data = {
            isSuperAdmin,
            isCompany,
            isUser,
            notUser,
            ...permissionsStatus
        };

        return successResponse(res, "Permission data fetched successfully", data);
    } catch (error) {
        console.error("Error in getPermAllowAPI:", error);
        return errorResponse(res, "Server error", {}, 500);
    }
};