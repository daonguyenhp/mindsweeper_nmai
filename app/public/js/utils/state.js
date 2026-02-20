// Khởi tạo kết nối Socket (dùng chung cho toàn bộ app)
const socket = io();

let LEVELS = {};

// Trạng thái Game
let aiHistory = [];
let currentBoardSize = 9;
let currentStepIndex = -1; 
let godModeCache = []; 