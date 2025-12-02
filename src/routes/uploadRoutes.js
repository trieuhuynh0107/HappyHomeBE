const express = require('express');
const router = express.Router();

const authenticate = require('../middlewares/auth');
const adminOnly = require('../middlewares/adminOnly');
const uploadController = require('../controllers/uploadController');
const { getUploadMiddleware } = require('../services/uploadService');

// Chỉ Admin mới được upload
router.use(authenticate);
router.use(adminOnly);

// Get upload middleware (local hoặc cloudinary)
const upload = getUploadMiddleware();

/**
 * @api {POST} /api/upload/image Upload Single Image
 * @apiVersion 1.0.0
 * @apiName UploadImage
 * @apiGroup Upload
 * @apiPermission admin
 *
 * @apiDescription Upload 1 ảnh lên Cloudinary. Chỉ Admin mới có quyền sử dụng.
 * Dùng để upload ảnh khi xây dựng layout của service (banner, gallery, etc.)
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiBody {File} image File ảnh (form-data field name: "image")
 *
 * @apiBody {File} image File ảnh cần upload
 * - Định dạng chấp nhận: jpeg, jpg, png, gif, webp
 * - Kích thước tối đa: 5MB
 *
 * @apiExample {curl} Example usage:
 * curl -X POST https://hello-node-render.onrender.com/api/upload/image \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -F "image=@/path/to/image.jpg"
 *
 * @apiSuccess {Boolean} success Trạng thái thành công (luôn là true)
 * @apiSuccess {String} message Thông báo thành công
 * @apiSuccess {Object} data Thông tin file đã upload
 * @apiSuccess {String} data.url URL đầy đủ của ảnh trên Cloudinary
 * @apiSuccess {String} data.filename Tên file hoặc public_id trên Cloudinary
 * @apiSuccess {Number} data.size Kích thước file (bytes)
 * @apiSuccess {String} data.mimetype MIME type của file
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Upload ảnh thành công",
 *       "data": {
 *         "url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079306/cleaning-service/uzynzcrujxjby2f2qm8b.jpg",
 *         "filename": "cleaning-service/uzynzcrujxjby2f2qm8b",
 *         "size": 245678,
 *         "mimetype": "image/jpeg"
 *       }
 *     }
 *
 * @apiError (Error 400) NoFile Không có file nào được gửi lên
 * @apiError (Error 400) InvalidFileType File không phải là ảnh hợp lệ
 * @apiError (Error 400) FileTooLarge File vượt quá giới hạn 5MB
 * @apiError (Error 401) Unauthorized Chưa đăng nhập hoặc token không hợp lệ
 * @apiError (Error 403) Forbidden Không có quyền Admin
 *
 * @apiErrorExample {json} Error-Response (No File):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Không có file nào được upload"
 *     }
 *
 * @apiErrorExample {json} Error-Response (Invalid File Type):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)"
 *     }
 *
 * @apiErrorExample {json} Error-Response (Unauthorized):
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "success": false,
 *       "message": "Không tìm thấy token xác thực"
 *     }
 *
 * @apiErrorExample {json} Error-Response (Forbidden):
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "success": false,
 *       "message": "Không có quyền truy cập. Chỉ dành cho Admin."
 *     }
 */
router.post('/image', upload.single('image'), uploadController.uploadImage);

/**
 * @api {POST} /api/upload/images Upload Multiple Images
 * @apiVersion 1.0.0
 * @apiName UploadMultipleImages
 * @apiGroup Upload
 * @apiPermission admin
 *
 * @apiDescription Upload nhiều ảnh cùng lúc (tối đa 10 ảnh/request) lên Cloudinary. 
 * Chỉ Admin mới có quyền sử dụng. Dùng để upload hàng loạt ảnh cho gallery hoặc portfolio.
 *
 * @apiHeader {String} Authorization Bearer token của Admin
 *
 * @apiBody {File[]} images Danh sách file ảnh (form-data field name: "images")
 *
 * @apiBody  {File[]} images Mảng file ảnh cần upload
 * - Số lượng tối đa: 10 ảnh/request
 * - Định dạng chấp nhận: jpeg, jpg, png, gif, webp
 * - Kích thước tối đa mỗi file: 5MB
 *
 * @apiExample {curl} Example usage:
 * curl -X POST https://hello-node-render.onrender.com/api/upload/images \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -F "images=@/path/to/image1.jpg" \
 *   -F "images=@/path/to/image2.jpg" \
 *   -F "images=@/path/to/image3.png"
 *
 * @apiSuccess {Boolean} success Trạng thái thành công (luôn là true)
 * @apiSuccess {String} message Thông báo thành công (số lượng ảnh đã upload)
 * @apiSuccess {Object} data Thông tin các file đã upload
 * @apiSuccess {Object[]} data.files Danh sách file đã upload
 * @apiSuccess {String} data.files.url URL đầy đủ của ảnh trên Cloudinary
 * @apiSuccess {String} data.files.filename Tên file hoặc public_id trên Cloudinary
 * @apiSuccess {Number} data.files.size Kích thước file (bytes)
 * @apiSuccess {String} data.files.mimetype MIME type của file
 * @apiSuccess {Number} data.count Tổng số ảnh đã upload thành công
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Upload 3 ảnh thành công",
 *       "data": {
 *         "files": [
 *           {
 *             "url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079306/cleaning-service/abc123.jpg",
 *             "filename": "cleaning-service/abc123",
 *             "size": 245678,
 *             "mimetype": "image/jpeg"
 *           },
 *           {
 *             "url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079308/cleaning-service/def456.jpg",
 *             "filename": "cleaning-service/def456",
 *             "size": 189234,
 *             "mimetype": "image/jpeg"
 *           },
 *           {
 *             "url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079310/cleaning-service/ghi789.png",
 *             "filename": "cleaning-service/ghi789",
 *             "size": 567890,
 *             "mimetype": "image/png"
 *           }
 *         ],
 *         "count": 3
 *       }
 *     }
 *
 * @apiError (Error 400) NoFiles Không có file nào được gửi lên
 * @apiError (Error 400) InvalidFileType Một hoặc nhiều file không phải là ảnh hợp lệ
 * @apiError (Error 400) FileTooLarge Một hoặc nhiều file vượt quá giới hạn 5MB
 * @apiError (Error 400) TooManyFiles Vượt quá giới hạn 10 ảnh/request
 * @apiError (Error 401) Unauthorized Chưa đăng nhập hoặc token không hợp lệ
 * @apiError (Error 403) Forbidden Không có quyền Admin
 *
 * @apiErrorExample {json} Error-Response (No Files):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Không có file nào được upload"
 *     }
 *
 * @apiErrorExample {json} Error-Response (Invalid File Type):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)"
 *     }
 *
 * @apiErrorExample {json} Error-Response (Too Many Files):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Tối đa 10 ảnh mỗi lần upload"
 *     }
 *
 * @apiErrorExample {json} Error-Response (Unauthorized):
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "success": false,
 *       "message": "Không tìm thấy token xác thực"
 *     }
 *
 * @apiErrorExample {json} Error-Response (Forbidden):
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "success": false,
 *       "message": "Không có quyền truy cập. Chỉ dành cho Admin."
 *     }
 */
router.post('/images', upload.array('images', 10), uploadController.uploadMultipleImages);

module.exports = router;