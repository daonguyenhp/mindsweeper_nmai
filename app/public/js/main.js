document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/config');
        LEVELS = await response.json();
        
        const difficultySelect = document.getElementById('difficulty');
        difficultySelect.innerHTML = ''; 
        
        // Định nghĩa thứ tự hiển thị: demo -> beginner -> expert -> master
        const sortOrder = ['tiny', 'beginner', 'expert', 'master'];
        
        // Đổ dữ liệu từ API vào dropdown menu theo thứ tự đã định
        const sortedEntries = Object.entries(LEVELS).sort((a, b) => {
            const indexA = sortOrder.indexOf(a[0]);
            const indexB = sortOrder.indexOf(b[0]);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
        
        for (const [key, config] of sortedEntries) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = config.desc || `${key} (${config.size}x${config.size})`;
            // Đặt Beginner làm mặc định
            if (key === 'beginner') option.selected = true;
            difficultySelect.appendChild(option);
        }
        
        addLog('system', 'SYSTEM KERNEL: Game configs loaded successfully.');
    } catch (error) {
        console.error('Failed to load configs from API:', error);
        addLog('system', 'ERROR: Failed to load configurations.', true);
    }
});