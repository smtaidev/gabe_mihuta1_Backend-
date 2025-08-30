import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import config from "../../config";
import { log } from "console";
import ApiError from "../../errors/ApiError";
import { GroupService } from "./group.service";

const joinGroup = catchAsync(async(req, res) => {
    const userId = req.user.id;
    const { groupId } = req.params;

    if (!groupId) {
        throw new ApiError(status.BAD_REQUEST, "Group ID is required");
    }

    const group = await GroupService.joinGroup(groupId, userId);
    sendResponse(res, {
        statusCode: status.OK,
        message: "Joined group successfully",
        data: group,
    });
});

const getAllGroups = catchAsync(async (req, res) => {

    const groups = await GroupService.getAllGroups();
    sendResponse(res, {
        statusCode: status.OK,
        message: "Fetched all groups successfully",
        data: groups,
    });
});

export const GroupController = {
    joinGroup,
    getAllGroups,
};