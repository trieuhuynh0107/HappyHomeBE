const express = require('express');
const router = express.Router();

// 1. Import Middleware
const authenticate = require('../middlewares/auth');
const adminOnly = require('../middlewares/adminOnly');
const {getUploadMiddleware} = require('../services/uploadService');
const upload = getUploadMiddleware();

// 2. Import Validators
const {
  createServiceValidation,
  updateServiceValidation,
  idParamValidation,
  validate
} = require('../validators/serviceValidator');

// 3. Import Controllers
const serviceController = require('../controllers/serviceController'); 
const bookingController = require('../controllers/bookingController');
const cleanerController = require('../controllers/cleanerController'); 
const adminStatisticalController = require('../controllers/adminStatisticalController'); 

// ============================================
// GLOBAL MIDDLEWARE
// ============================================
router.use(authenticate);
router.use(adminOnly);


// ============================================
// 1. SERVICE MANAGEMENT
// ============================================

/**
 * @api {GET} /api/admin/services/block-schemas Get Block Schemas
 * @apiVersion 1.0.0
 * @apiName GetBlockSchemas
 * @apiGroup Admin - Service Management
 * @apiPermission admin
 *
 * @apiDescription Lấy danh sách các loại block và schema validation để xây dựng layout_config.
 * Dùng khi Admin muốn biết có những loại block nào (intro, pricing, task_tab, process, booking, definition)
 * và mỗi loại cần những field gì.
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiExample {curl} Example usage:
 * curl -i https://hello-node-render.onrender.com/api/admin/services/block-schemas \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {Object} data Dữ liệu trả về
 * @apiSuccess {Object} data.block_types Danh sách các loại block (INTRO, PRICING, TASK_TAB, PROCESS, BOOKING, DEFINITION)
 * @apiSuccess {Object} data.schemas Chi tiết schema cho từng loại block
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "block_types": {
 *           "INTRO": "intro",
 *           "PRICING": "pricing",
 *           "TASK_TAB": "task_tab",
 *           "PROCESS": "process",
 *           "BOOKING": "booking",
 *           "DEFINITION": "definition"
 *         },
 *         "schemas": {
 *           "intro": {
 *             "type": "intro",
 *             "name": "Giới thiệu",
 *             "fields": {
 *               "title": { "type": "text", "label": "Tiêu đề", "required": true },
 *               "banner_image_url": { "type": "image", "label": "Ảnh banner", "required": true }
 *             }
 *           },
 *           "pricing": { ... },
 *           "task_tab": { ... }
 *         }
 *       }
 *     }
 *
 * @apiError (Error 401) Unauthorized Chưa đăng nhập
 * @apiError (Error 403) Forbidden Không có quyền Admin
 */
router.get('/services/block-schemas', serviceController.getBlockSchemas);

/**
 * @api {GET} /api/admin/services Get All Services (Admin View)
 * @apiVersion 1.0.0
 * @apiName GetAdminServices
 * @apiGroup Admin - Service Management
 * @apiPermission admin
 *
 * @apiDescription Lấy danh sách tất cả dịch vụ (bao gồm cả active và inactive). 
 * Admin có thể lọc theo trạng thái.
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiParam (Query) {String="active","inactive"} [status] Lọc theo trạng thái dịch vụ
 *
 * @apiExample {curl} Example usage:
 * curl -i https://hello-node-render.onrender.com/api/admin/services?status=active \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {Object} data Dữ liệu trả về
 * @apiSuccess {Object[]} data.services Danh sách dịch vụ
 * @apiSuccess {Number} data.services.id ID dịch vụ
 * @apiSuccess {String} data.services.name Tên dịch vụ
 * @apiSuccess {String} data.services.description Mô tả
 * @apiSuccess {Number} data.services.base_price Giá cơ bản
 * @apiSuccess {Number} data.services.duration_minutes Thời gian (phút)
 * @apiSuccess {Boolean} data.services.is_active Trạng thái hoạt động
 * @apiSuccess {String} data.services.created_at Thời gian tạo
 * @apiSuccess {Number} data.total Tổng số dịch vụ
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "services": [
 *           {
 *             "id": 1,
 *             "name": "Home Cleaning",
 *             "description": "Home cleaning service",
 *             "base_price": 150000,
 *             "duration_minutes": 120,
 *             "is_active": true,
 *             "created_at": "2024-01-15T10:30:00.000Z"
 *           }
 *         ],
 *         "total": 1
 *       }
 *     }
 */
router.get('/services', serviceController.getAdminServices);

/**
 * @api {GET} /api/admin/services/:id Get Service For Edit
 * @apiVersion 1.0.0
 * @apiName GetServiceForEdit
 * @apiGroup Admin - Service Management
 * @apiPermission admin
 *
 * @apiDescription Lấy chi tiết đầy đủ của 1 dịch vụ để chỉnh sửa (bao gồm layout_config).
 * Khác với public route, Admin có thể xem cả dịch vụ inactive.
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiParam (URL Params) {Number} id ID của dịch vụ
 *
 * @apiExample {curl} Example usage:
 * curl -i https://hello-node-render.onrender.com/api/admin/services/1 \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {Object} data Dữ liệu trả về
 * @apiSuccess {Object} data.service Thông tin đầy đủ của dịch vụ (giống public route nhưng có thể xem inactive)
 *
 * @apiError (Error 400) InvalidID ID không hợp lệ
 * @apiError (Error 404) NotFound Không tìm thấy dịch vụ
 */
router.get('/services/:id', idParamValidation, validate, serviceController.getServiceForEdit);

/**
 * @api {POST} /api/admin/services Create Service
 * @apiVersion 1.0.0
 * @apiName CreateService
 * @apiGroup Admin - Service Management
 * @apiPermission admin
 *
 * @apiDescription Tạo dịch vụ mới. Dịch vụ mới sẽ tự động có trạng thái active.
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 * @apiHeader {String} Content-Type application/json
 *
 * @apiBody {String} name Tên dịch vụ (tối đa 100 ký tự)
 * @apiBody {String} [description] Mô tả dịch vụ
 * @apiBody {Number} base_price Giá cơ bản (phải > 0)
 * @apiBody {Number} duration_minutes Thời gian thực hiện (phút, phải > 0)
 * @apiBody {Object[]} [layout_config] Cấu hình layout (array of blocks)
 *
 * @apiExample {curl} Example usage:
 * curl -X POST https://hello-node-render.onrender.com/api/admin/services \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "name": "Deep Cleaning",
 *     "description": "Professional deep cleaning service",
 *     "base_price": 300000,
 *     "duration_minutes": 180,
 *     "layout_config": []
 *   }'
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {String} message Thông báo
 * @apiSuccess {Object} data Dữ liệu dịch vụ vừa tạo
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *       "success": true,
 *       "message": "Tạo dịch vụ thành công",
 *       "data": {
 *         "service": {
 *           "id": 3,
 *           "name": "Deep Cleaning",
 *           "description": "Professional deep cleaning service",
 *           "base_price": 300000,
 *           "duration_minutes": 180,
 *           "is_active": true,
 *           "layout_config": []
 *         }
 *       }
 *     }
 *
 * @apiError (Error 400) ValidationError Dữ liệu không hợp lệ
 * @apiError (Error 400) InvalidPriceDuration Giá hoặc thời gian không hợp lệ
 * @apiError (Error 400) InvalidLayout Layout config không đúng schema
 *
 * @apiErrorExample {json} Error-Response (Validation):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Dữ liệu không hợp lệ",
 *       "errors": [
 *         {
 *           "field": "name",
 *           "message": "Tên dịch vụ không được để trống"
 *         }
 *       ]
 *     }
 */
router.post('/services', createServiceValidation, validate, serviceController.createService);

/**
 * @api {PUT} /api/admin/services/:id Update Service
 * @apiVersion 1.0.0
 * @apiName UpdateService
 * @apiGroup Admin - Service Management
 * @apiPermission admin
 *
 * @apiDescription Cập nhật thông tin dịch vụ (tên, mô tả, giá, thời gian, layout_config).
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 * @apiHeader {String} Content-Type application/json
 *
 * @apiParam (URL Params) {Number} id ID của dịch vụ cần cập nhật
 *
 * @apiBody {String} [name] Tên dịch vụ
 * @apiBody {String} [description] Mô tả
 * @apiBody {Number} [base_price] Giá cơ bản
 * @apiBody {Number} [duration_minutes] Thời gian (phút)
 * @apiBody {Object[]} [layout_config] Cấu hình layout
 *
 * @apiExample {curl} Example usage:
 * curl -X PUT https://hello-node-render.onrender.com/api/admin/services/1 \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -H "Content-Type: application/json" \
 *   -d '{"base_price": 180000}'
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {String} message Thông báo
 * @apiSuccess {Object} data Dịch vụ sau khi cập nhật
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Cập nhật thành công",
 *       "data": {
 *         "service": { ... }
 *       }
 *     }
 *
 * @apiError (Error 400) ValidationError Dữ liệu không hợp lệ
 * @apiError (Error 404) NotFound Không tìm thấy dịch vụ
 */
router.put('/services/:id', updateServiceValidation, validate, serviceController.updateService);

/**
 * @api {PUT} /api/admin/services/:id/layout Update Service Layout
 * @apiVersion 1.0.0
 * @apiName UpdateServiceLayout
 * @apiGroup Admin - Service Management
 * @apiPermission admin
 *
 * @apiDescription Cập nhật riêng layout_config của dịch vụ (không ảnh hưởng các field khác).
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 * @apiHeader {String} Content-Type application/json
 *
 * @apiParam (URL Params) {Number} id ID của dịch vụ
 *
 * @apiBody {Object[]} layout_config Cấu hình layout mới (array of blocks)
 *
 * @apiExample {curl} Example usage:
 * curl -X PUT https://hello-node-render.onrender.com/api/admin/services/1/layout \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -H "Content-Type: application/json" \
 *   -d '{"layout_config": [...]}'
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {String} message Thông báo
 * @apiSuccess {Object} data Dịch vụ sau khi cập nhật layout
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Cập nhật layout thành công",
 *       "data": {
 *         "service": { ... }
 *       }
 *     }
 *
 * @apiError (Error 400) InvalidLayout Layout không đúng schema
 * @apiError (Error 404) NotFound Không tìm thấy dịch vụ
 */
router.put('/services/:id/layout', idParamValidation, validate, serviceController.updateServiceLayout);

/**
 * @api {PATCH} /api/admin/services/:id/toggle Toggle Service Status
 * @apiVersion 1.0.0
 * @apiName ToggleServiceStatus
 * @apiGroup Admin - Service Management
 * @apiPermission admin
 *
 * @apiDescription Bật/Tắt trạng thái hoạt động của dịch vụ (chuyển đổi is_active).
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiParam (URL Params) {Number} id ID của dịch vụ
 *
 * @apiExample {curl} Example usage:
 * curl -X PATCH https://hello-node-render.onrender.com/api/admin/services/1/toggle \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {String} message Thông báo (Đã bật/tắt dịch vụ)
 * @apiSuccess {Object} data Dịch vụ sau khi cập nhật
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Đã bật dịch vụ",
 *       "data": {
 *         "service": {
 *           "id": 1,
 *           "is_active": true,
 *           ...
 *         }
 *       }
 *     }
 *
 * @apiError (Error 404) NotFound Không tìm thấy dịch vụ
 */
router.patch('/services/:id/toggle', idParamValidation, validate, serviceController.toggleService);

/**
 * @api {DELETE} /api/admin/services/:id Delete Service
 * @apiVersion 1.0.0
 * @apiName DeleteService
 * @apiGroup Admin - Service Management
 * @apiPermission admin
 *
 * @apiDescription Xóa dịch vụ. Chỉ xóa được nếu dịch vụ chưa có đơn hàng nào.
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiParam (URL Params) {Number} id ID của dịch vụ
 *
 * @apiExample {curl} Example usage:
 * curl -X DELETE https://hello-node-render.onrender.com/api/admin/services/1 \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {String} message Thông báo xóa thành công
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Xóa dịch vụ thành công"
 *     }
 *
 * @apiError (Error 400) HasBookings Không thể xóa vì đã có đơn hàng sử dụng dịch vụ
 * @apiError (Error 404) NotFound Không tìm thấy dịch vụ
 *
 * @apiErrorExample {json} Error-Response (Has Bookings):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Không thể xóa vì đã có đơn hàng sử dụng dịch vụ này."
 *     }
 */
router.delete('/services/:id', idParamValidation, validate, serviceController.deleteService);


// ============================================
// 2. CLEANER MANAGEMENT
// ============================================

/**
 * @api {POST} /api/admin/cleaners Create Cleaner
 * @apiVersion 1.0.0
 * @apiName CreateCleaner
 * @apiGroup Admin - Cleaners
 * @apiPermission admin
 *
 * @apiDescription Tạo nhân viên làm vệ sinh mới. Hỗ trợ upload avatar.
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiBody {String} name Tên nhân viên (bắt buộc)
 * @apiBody {String} phone Số điện thoại (bắt buộc, unique)
 * @apiBody {String} [email] Email nhân viên (optional)
 * @apiBody {String} [address] Địa chỉ nhân viên (optional)
 * @apiBody {String="ACTIVE","INACTIVE","ON_LEAVE"} [status=ACTIVE] Trạng thái hoạt động (optional, default: ACTIVE)
 * @apiBody {File} [avatar] Ảnh đại diện (optional, max 5MB)
 *
 * @apiExample {curl} Example usage:
 * curl -X POST https://hello-node-render.onrender.com/api/admin/cleaners \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -F "name=Nguyen Van A" \
 *   -F "phone=0901234567" \
 *   -F "email=nguyenvana@example.com" \
 *   -F "status=ACTIVE" \
 *   -F "avatar=@/path/to/avatar.jpg"
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {String} message Thông báo
 * @apiSuccess {Object} data Thông tin nhân viên vừa tạo
 * @apiSuccess {Number} data.id ID nhân viên
 * @apiSuccess {String} data.name Tên nhân viên
 * @apiSuccess {String} data.phone Số điện thoại
 * @apiSuccess {String} data.email Email (có thể null)
 * @apiSuccess {String} data.avatar URL avatar trên Cloudinary (có thể null)
 * @apiSuccess {String} data.address Địa chỉ (có thể null)
 * @apiSuccess {String} data.status Trạng thái (ACTIVE/INACTIVE/ON_LEAVE)
 * @apiSuccess {String} data.created_at Thời gian tạo
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *       "success": true,
 *       "message": "Tạo nhân viên thành công!",
 *       "data": {
 *         "id": 5,
 *         "name": "Nguyen Van A",
 *         "phone": "0901234567",
 *         "email": "nguyenvana@example.com",
 *         "avatar": "https://res.cloudinary.com/.../avatar.jpg",
 *         "address": null,
 *         "status": "ACTIVE",
 *         "created_at": "2024-01-20T10:30:00.000Z"
 *       }
 *     }
 *
 * @apiError (Error 400) MissingFields Thiếu tên hoặc số điện thoại
 * @apiError (Error 400) PhoneDuplicate Số điện thoại đã tồn tại
 * @apiError (Error 401) Unauthorized Chưa đăng nhập
 * @apiError (Error 403) Forbidden Không có quyền Admin
 *
 * @apiErrorExample {json} Error-Response (Missing Fields):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Tên và số điện thoại là bắt buộc."
 *     }
 *
 * @apiErrorExample {json} Error-Response (Phone Duplicate):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Số điện thoại nhân viên này đã tồn tại."
 *     }
 */
router.post('/cleaners', upload.single('avatar'), cleanerController.createCleaner);

/**
 * @api {GET} /api/admin/cleaners Get All Cleaners
 * @apiVersion 1.0.0
 * @apiName GetAllCleaners
 * @apiGroup Admin - Cleaners
 * @apiPermission admin
 *
 * @apiDescription Lấy danh sách tất cả nhân viên. Có thể lọc theo trạng thái.
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiParam (Query) {String="ACTIVE","INACTIVE","ON_LEAVE"} [status] Lọc theo trạng thái (optional)
 *
 * @apiExample {curl} Example usage (All cleaners):
 * curl -X GET https://hello-node-render.onrender.com/api/admin/cleaners \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiExample {curl} Example usage (Filter by status):
 * curl -X GET https://hello-node-render.onrender.com/api/admin/cleaners?status=ACTIVE \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {Object[]} data Danh sách nhân viên
 * @apiSuccess {Number} data.id ID nhân viên
 * @apiSuccess {String} data.name Tên nhân viên
 * @apiSuccess {String} data.phone Số điện thoại
 * @apiSuccess {String} data.email Email
 * @apiSuccess {String} data.avatar URL avatar
 * @apiSuccess {String} data.address Địa chỉ
 * @apiSuccess {String} data.status Trạng thái
 * @apiSuccess {String} data.created_at Thời gian tạo
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": [
 *         {
 *           "id": 1,
 *           "name": "Nguyen Van A",
 *           "phone": "0901234567",
 *           "email": "nguyenvana@example.com",
 *           "avatar": "https://res.cloudinary.com/.../avatar1.jpg",
 *           "address": "123 Street, District 1, HCMC",
 *           "status": "ACTIVE",
 *           "created_at": "2024-01-15T08:00:00.000Z"
 *         },
 *         {
 *           "id": 2,
 *           "name": "Tran Thi B",
 *           "phone": "0907654321",
 *           "email": null,
 *           "avatar": null,
 *           "address": null,
 *           "status": "ON_LEAVE",
 *           "created_at": "2024-01-18T14:30:00.000Z"
 *         }
 *       ]
 *     }
 */
router.get('/cleaners', cleanerController.getAllCleaners);

/**
 * @api {GET} /api/admin/cleaners/:id Get Cleaner By ID
 * @apiVersion 1.0.0
 * @apiName GetCleanerById
 * @apiGroup Admin - Cleaners
 * @apiPermission admin
 *
 * @apiDescription Lấy thông tin chi tiết 1 nhân viên theo ID.
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiParam (URL Param) {Number} id ID của nhân viên
 *
 * @apiExample {curl} Example usage:
 * curl -X GET https://hello-node-render.onrender.com/api/admin/cleaners/5 \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {Object} data Thông tin nhân viên
 * @apiSuccess {Number} data.id ID nhân viên
 * @apiSuccess {String} data.name Tên nhân viên
 * @apiSuccess {String} data.phone Số điện thoại
 * @apiSuccess {String} data.email Email
 * @apiSuccess {String} data.avatar URL avatar
 * @apiSuccess {String} data.address Địa chỉ
 * @apiSuccess {String} data.status Trạng thái
 * @apiSuccess {String} data.created_at Thời gian tạo
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "id": 5,
 *         "name": "Nguyen Van A",
 *         "phone": "0901234567",
 *         "email": "nguyenvana@example.com",
 *         "avatar": "https://res.cloudinary.com/.../avatar.jpg",
 *         "address": "123 Street, District 1, HCMC",
 *         "status": "ACTIVE",
 *         "created_at": "2024-01-20T10:30:00.000Z"
 *       }
 *     }
 *
 * @apiError (Error 404) NotFound Nhân viên không tồn tại
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "success": false,
 *       "message": "Nhân viên không tồn tại."
 *     }
 */
router.get('/cleaners/:id', cleanerController.getCleanerById);

/**
 * @api {PUT} /api/admin/cleaners/:id/status Update Cleaner Status
 * @apiVersion 1.0.0
 * @apiName UpdateCleanerStatus
 * @apiGroup Admin - Cleaners
 * @apiPermission admin
 *
 * @apiDescription Cập nhật trạng thái nhân viên. Kiểm tra logic: nếu chuyển sang INACTIVE hoặc ON_LEAVE,
 * hệ thống sẽ kiểm tra xem nhân viên có đang vướng booking nào trong tương lai không.
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiParam (URL Param) {Number} id ID của nhân viên
 * @apiBody  {String="ACTIVE","INACTIVE","ON_LEAVE"} status Trạng thái mới
 *
 * @apiExample {curl} Example usage:
 * curl -X PUT https://hello-node-render.onrender.com/api/admin/cleaners/5/status \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -H "Content-Type: application/json" \
 *   -d '{"status": "ON_LEAVE"}'
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {String} message Thông báo cập nhật thành công
 * @apiSuccess {Object} data Thông tin nhân viên sau khi cập nhật
 * @apiSuccess {Number} data.id ID nhân viên
 * @apiSuccess {String} data.name Tên nhân viên
 * @apiSuccess {String} data.status Trạng thái mới
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Cập nhật trạng thái nhân viên thành: ON_LEAVE",
 *       "data": {
 *         "id": 5,
 *         "name": "Nguyen Van A",
 *         "phone": "0901234567",
 *         "email": "nguyenvana@example.com",
 *         "avatar": "https://res.cloudinary.com/.../avatar.jpg",
 *         "address": "123 Street, District 1, HCMC",
 *         "status": "ON_LEAVE",
 *         "created_at": "2024-01-20T10:30:00.000Z"
 *       }
 *     }
 *
 * @apiError (Error 400) InvalidStatus Trạng thái không hợp lệ
 * @apiError (Error 404) NotFound Nhân viên không tồn tại
 * @apiError (Error 409) HasFutureBookings Nhân viên còn booking chưa hoàn thành trong tương lai
 *
 * @apiErrorExample {json} Error-Response (Invalid Status):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Trạng thái không hợp lệ."
 *     }
 *
 * @apiErrorExample {json} Error-Response (Has Future Bookings):
 *     HTTP/1.1 409 Conflict
 *     {
 *       "success": false,
 *       "message": "Không thể chuyển trạng thái sang ON_LEAVE vì nhân viên này còn 3 đơn hàng chưa hoàn thành."
 *     }
 */
router.put('/cleaners/:id/status', cleanerController.updateCleanerStatus);

module.exports = router;


// ============================================
// 3. BOOKING ASSIGNMENT
// ============================================

/**
 * @api {GET} /api/admin/bookings Get All Bookings
 * @apiVersion 1.0.0
 * @apiName GetAllBookings
 * @apiGroup Admin - Bookings
 * @apiPermission admin
 *
 * @apiDescription Lấy danh sách tất cả booking với phân trang và bộ lọc. 
 * Hỗ trợ tìm kiếm theo ID, location, note.
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiParam (Query) {Number} [page=1] Số trang (pagination)
 * @apiParam (Query) {Number} [limit=10] Số lượng booking mỗi trang
 * @apiParam (Query) {String="PENDING","CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED"} [status] Lọc theo trạng thái
 * @apiParam (Query) {String} [date] Lọc theo ngày (format: YYYY-MM-DD)
 * @apiParam (Query) {String} [search] Tìm kiếm theo ID/location/note
 *
 * @apiExample {curl} Example usage (All bookings):
 * curl -X GET "https://hello-node-render.onrender.com/api/admin/bookings?page=1&limit=10" \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiExample {curl} Example usage (Filter):
 * curl -X GET "https://hello-node-render.onrender.com/api/admin/bookings?status=PENDING&date=2024-01-20" \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {Object} data Dữ liệu trả về
 * @apiSuccess {Object[]} data.bookings Danh sách booking
 * @apiSuccess {Number} data.bookings.id ID booking
 * @apiSuccess {Number} data.bookings.customer_id ID khách hàng
 * @apiSuccess {Number} data.bookings.service_id ID dịch vụ
 * @apiSuccess {Number} data.bookings.cleaner_id ID nhân viên (có thể null)
 * @apiSuccess {String} data.bookings.status Trạng thái
 * @apiSuccess {String} data.bookings.start_time Thời gian bắt đầu
 * @apiSuccess {String} data.bookings.end_time Thời gian kết thúc
 * @apiSuccess {String} data.bookings.location Địa điểm
 * @apiSuccess {String} data.bookings.note Ghi chú
 * @apiSuccess {Number} data.bookings.total_price Tổng giá
 * @apiSuccess {String} data.bookings.payment_status Trạng thái thanh toán
 * @apiSuccess {Object} data.bookings.booking_data Dữ liệu form động
 * @apiSuccess {Object} data.bookings.customer Thông tin khách hàng
 * @apiSuccess {Object} data.bookings.service Thông tin dịch vụ
 * @apiSuccess {Object} data.bookings.cleaner Thông tin nhân viên (có thể null)
 * @apiSuccess {Object} data.pagination Thông tin phân trang
 * @apiSuccess {Number} data.pagination.totalItems Tổng số booking
 * @apiSuccess {Number} data.pagination.totalPages Tổng số trang
 * @apiSuccess {Number} data.pagination.currentPage Trang hiện tại
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "bookings": [
 *           {
 *             "id": 15,
 *             "customer_id": 3,
 *             "service_id": 1,
 *             "cleaner_id": 5,
 *             "status": "CONFIRMED",
 *             "start_time": "2024-01-25T09:00:00.000Z",
 *             "end_time": "2024-01-25T11:00:00.000Z",
 *             "location": "123 Street, District 1, HCMC",
 *             "note": "Please bring cleaning supplies",
 *             "total_price": 400000,
 *             "payment_status": "UNPAID",
 *             "booking_data": {
 *               "name": "Nguyen Van A",
 *               "phone": "0901234567",
 *               "subservice_id": "2br"
 *             },
 *             "customer": {
 *               "id": 3,
 *               "full_name": "Nguyen Van A",
 *               "phone": "0901234567"
 *             },
 *             "service": {
 *               "name": "Home Cleaning"
 *             },
 *             "cleaner": {
 *               "id": 5,
 *               "name": "Tran Van B",
 *               "phone": "0907654321"
 *             },
 *             "created_at": "2024-01-20T10:00:00.000Z"
 *           }
 *         ],
 *         "pagination": {
 *           "totalItems": 45,
 *           "totalPages": 5,
 *           "currentPage": 1
 *         }
 *       }
 *     }
 */
router.get('/bookings', bookingController.getAllBookings);

/**
 * @api {GET} /api/admin/bookings/:bookingId/available-cleaners Get Available Cleaners
 * @apiVersion 1.0.0
 * @apiName GetAvailableCleaners
 * @apiGroup Admin - Bookings
 * @apiPermission admin
 *
 * @apiDescription Lấy danh sách nhân viên có thể gán cho booking (không bị trùng lịch).
 * Hệ thống kiểm tra tất cả nhân viên ACTIVE và loại bỏ những người đã có booking trùng giờ.
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiParam (URL Param) {Number} bookingId ID của booking cần gán nhân viên
 *
 * @apiExample {curl} Example usage:
 * curl -X GET https://hello-node-render.onrender.com/api/admin/bookings/15/available-cleaners \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {Object[]} data Danh sách nhân viên có thể gán
 * @apiSuccess {Number} data.id ID nhân viên
 * @apiSuccess {String} data.name Tên nhân viên
 * @apiSuccess {String} data.phone Số điện thoại
 * @apiSuccess {String} data.email Email
 * @apiSuccess {String} data.avatar URL avatar
 * @apiSuccess {String} data.status Trạng thái (luôn là ACTIVE)
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": [
 *         {
 *           "id": 5,
 *           "name": "Tran Van B",
 *           "phone": "0907654321",
 *           "email": "tranvanb@example.com",
 *           "avatar": "https://res.cloudinary.com/.../avatar5.jpg",
 *           "status": "ACTIVE"
 *         },
 *         {
 *           "id": 8,
 *           "name": "Le Thi C",
 *           "phone": "0909876543",
 *           "email": null,
 *           "avatar": null,
 *           "status": "ACTIVE"
 *         }
 *       ]
 *     }
 *
 * @apiError (Error 404) NotFound Booking không tồn tại
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "success": false,
 *       "message": "Not found"
 *     }
 */
router.get('/bookings/:bookingId/available-cleaners', bookingController.getAvailableCleaners);

/**
 * @api {POST} /api/admin/bookings/assign Assign Cleaner to Booking
 * @apiVersion 1.0.0
 * @apiName AssignCleaner
 * @apiGroup Admin - Bookings
 * @apiPermission admin
 *
 * @apiDescription Gán nhân viên cho booking. Hệ thống sẽ:
 * - Kiểm tra nhân viên có trạng thái ACTIVE không
 * - Kiểm tra nhân viên có bị trùng lịch không (buffer 30 phút)
 * - Tự động chuyển status booking sang CONFIRMED
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiBody {Number} booking_id ID của booking cần gán
 * @apiBody {Number} cleaner_id ID của nhân viên được gán
 *
 * @apiExample {curl} Example usage:
 * curl -X POST https://hello-node-render.onrender.com/api/admin/bookings/assign \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -H "Content-Type: application/json" \
 *   -d '{"booking_id": 15, "cleaner_id": 5}'
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {String} message Thông báo gán thành công (bao gồm tên nhân viên)
 * @apiSuccess {Object} data Thông tin booking sau khi gán
 * @apiSuccess {Number} data.id ID booking
 * @apiSuccess {Number} data.cleaner_id ID nhân viên đã gán
 * @apiSuccess {String} data.status Trạng thái mới (CONFIRMED)
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Đã gán nhân viên Tran Van B thành công!",
 *       "data": {
 *         "id": 15,
 *         "customer_id": 3,
 *         "service_id": 1,
 *         "cleaner_id": 5,
 *         "status": "CONFIRMED",
 *         "start_time": "2024-01-25T09:00:00.000Z",
 *         "end_time": "2024-01-25T11:00:00.000Z",
 *         "location": "123 Street, District 1, HCMC",
 *         "total_price": 400000
 *       }
 *     }
 *
 * @apiError (Error 400) CleanerUnavailable Nhân viên không hoạt động (status không phải ACTIVE)
 * @apiError (Error 409) ConflictSchedule Nhân viên bị trùng lịch với booking khác
 *
 * @apiErrorExample {json} Error-Response (Cleaner Unavailable):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Nhân viên không hoạt động"
 *     }
 *
 * @apiErrorExample {json} Error-Response (Conflict Schedule):
 *     HTTP/1.1 409 Conflict
 *     {
 *       "success": false,
 *       "message": "Nhân viên bị trùng lịch!"
 *     }
 */
router.post('/bookings/assign', bookingController.assignCleaner);

/**
 * @api {PUT} /api/admin/bookings/:id/status Update Booking Status
 * @apiVersion 1.0.0
 * @apiName UpdateBookingStatus
 * @apiGroup Admin - Bookings
 * @apiPermission admin
 *
 * @apiDescription Cập nhật trạng thái booking. Có validate luồng chuyển trạng thái:
 * - IN_PROGRESS: Chỉ chuyển được từ CONFIRMED
 * - COMPLETED: Chỉ chuyển được từ IN_PROGRESS
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiParam {Number} id ID của booking
 * @apiBody {String="PENDING","CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED"} status Trạng thái mới
 *
 * @apiExample {curl} Example usage:
 * curl -X PUT https://hello-node-render.onrender.com/api/admin/bookings/15/status \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -H "Content-Type: application/json" \
 *   -d '{"status": "IN_PROGRESS"}'
 *
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {String} message Thông báo cập nhật thành công
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Cập nhật trạng thái thành công"
 *     }
 *
 * @apiError (Error 400) InvalidStatusFlow Luồng chuyển trạng thái không hợp lệ
 * @apiError (Error 404) NotFound Booking không tồn tại
 *
 * @apiErrorExample {json} Error-Response (Invalid Status Flow):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message": "Phải CONFIRMED mới được START"
 *     }
 *
 * @apiErrorExample {json} Error-Response (Not Found):
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "Not found"
 *     }
 */
router.put('/bookings/:id/status', bookingController.updateStatus);

// ============================================
// 4. STATISTICAL & DASHBOARD
// ============================================
/**
 * @api {GET} /api/admin/stats/dashboard Get Dashboard Statistics
 * @apiVersion 1.0.0
 * @apiName GetDashboardStats
 * @apiGroup Admin - Statistics
 * @apiPermission Admin (JWT Token Required)
 *
 * @apiDescription Lấy tổng quan thống kê cho trang Dashboard của Admin. Bao gồm: tổng doanh thu, số lượng đơn hàng, khách hàng, phân bố theo trạng thái, top dịch vụ bán chạy và hoạt động gần đây.
 *
 * @apiHeader {String} Authorization JWT token với format: Bearer {token}
 *
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     }
 *
 * @apiExample {curl} Example usage:
 * curl -i -X GET https://hello-node-render.onrender.com/api/admin/stats/dashboard \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiSuccess {Boolean} success Trạng thái thành công (true)
 * @apiSuccess {Object} data Dữ liệu thống kê
 * @apiSuccess {Object} data.summary Thống kê tổng quan
 * @apiSuccess {Number} data.summary.total_revenue Tổng doanh thu (chỉ tính đơn COMPLETED)
 * @apiSuccess {Number} data.summary.total_bookings Tổng số đơn hàng
 * @apiSuccess {Number} data.summary.total_customers Tổng số khách hàng (role CUSTOMER)
 * @apiSuccess {Object} data.charts Dữ liệu cho biểu đồ
 * @apiSuccess {Object[]} data.charts.by_status Phân bố đơn hàng theo trạng thái
 * @apiSuccess {String} data.charts.by_status.status Trạng thái (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
 * @apiSuccess {Number} data.charts.by_status.count Số lượng đơn theo trạng thái
 * @apiSuccess {Object[]} data.charts.top_services Top 5 dịch vụ bán chạy nhất
 * @apiSuccess {Number} data.charts.top_services.service_id ID của dịch vụ
 * @apiSuccess {Number} data.charts.top_services.count Số lượng đơn đặt dịch vụ này
 * @apiSuccess {Object} data.charts.top_services.service Thông tin dịch vụ
 * @apiSuccess {String} data.charts.top_services.service.name Tên dịch vụ
 * @apiSuccess {Object[]} data.recent_activity 5 đơn hàng gần nhất
 * @apiSuccess {Number} data.recent_activity.id ID booking
 * @apiSuccess {String} data.recent_activity.status Trạng thái booking
 * @apiSuccess {Number} data.recent_activity.total_price Giá trị đơn hàng
 * @apiSuccess {String} data.recent_activity.created_at Thời gian tạo (ISO 8601)
 * @apiSuccess {Object} data.recent_activity.customer Thông tin khách hàng
 * @apiSuccess {String} data.recent_activity.customer.full_name Tên khách hàng
 * @apiSuccess {Object} data.recent_activity.service Thông tin dịch vụ
 * @apiSuccess {String} data.recent_activity.service.name Tên dịch vụ
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "summary": {
 *           "total_revenue": 15750000,
 *           "total_bookings": 45,
 *           "total_customers": 28
 *         },
 *         "charts": {
 *           "by_status": [
 *             {
 *               "status": "PENDING",
 *               "count": 8
 *             },
 *             {
 *               "status": "CONFIRMED",
 *               "count": 12
 *             },
 *             {
 *               "status": "IN_PROGRESS",
 *               "count": 3
 *             },
 *             {
 *               "status": "COMPLETED",
 *               "count": 18
 *             },
 *             {
 *               "status": "CANCELLED",
 *               "count": 4
 *             }
 *           ],
 *           "top_services": [
 *             {
 *               "service_id": 1,
 *               "count": 25,
 *               "service": {
 *                 "name": "Home Cleaning"
 *               }
 *             },
 *             {
 *               "service_id": 2,
 *               "count": 15,
 *               "service": {
 *                 "name": "Full-package House Moving"
 *               }
 *             },
 *             {
 *               "service_id": 3,
 *               "count": 5,
 *               "service": {
 *                 "name": "Laundry Service"
 *               }
 *             }
 *           ]
 *         },
 *         "recent_activity": [
 *           {
 *             "id": 45,
 *             "status": "CONFIRMED",
 *             "total_price": 400000,
 *             "created_at": "2024-12-02T08:30:00.000Z",
 *             "customer": {
 *               "full_name": "Nguyen Van A"
 *             },
 *             "service": {
 *               "name": "Home Cleaning"
 *             }
 *           },
 *           {
 *             "id": 44,
 *             "status": "PENDING",
 *             "total_price": 350000,
 *             "created_at": "2024-12-02T07:15:00.000Z",
 *             "customer": {
 *               "full_name": "Tran Thi B"
 *             },
 *             "service": {
 *               "name": "Full-package House Moving"
 *             }
 *           },
 *           {
 *             "id": 43,
 *             "status": "COMPLETED",
 *             "total_price": 550000,
 *             "created_at": "2024-12-01T15:20:00.000Z",
 *             "customer": {
 *               "full_name": "Le Van C"
 *             },
 *             "service": {
 *               "name": "Home Cleaning"
 *             }
 *           },
 *           {
 *             "id": 42,
 *             "status": "COMPLETED",
 *             "total_price": 800000,
 *             "created_at": "2024-12-01T14:00:00.000Z",
 *             "customer": {
 *               "full_name": "Pham Thi D"
 *             },
 *             "service": {
 *               "name": "Full-package House Moving"
 *             }
 *           },
 *           {
 *             "id": 41,
 *             "status": "CANCELLED",
 *             "total_price": 400000,
 *             "created_at": "2024-12-01T10:00:00.000Z",
 *             "customer": {
 *               "full_name": "Hoang Van E"
 *             },
 *             "service": {
 *               "name": "Home Cleaning"
 *             }
 *           }
 *         ]
 *       }
 *     }
 *
 * @apiError (401) Unauthorized Token không hợp lệ hoặc đã hết hạn
 * @apiError (403) Forbidden User không có quyền Admin
 * @apiError (500) InternalServerError Lỗi server
 *
 * @apiErrorExample Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "success": false,
 *       "message": "Token không hợp lệ"
 *     }
 *
 * @apiErrorExample Forbidden:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "success": false,
 *       "message": "Bạn không có quyền truy cập"
 *     }
 *
 * @apiErrorExample Internal Server Error:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "success": false,
 *       "message": "Đã xảy ra lỗi khi lấy thống kê"
 *     }
 */
router.get('/stats/dashboard', adminStatisticalController.getDashboardStats);

module.exports = router;