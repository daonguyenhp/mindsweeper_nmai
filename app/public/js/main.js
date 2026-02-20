document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/config');
        LEVELS = await response.json();
        
        const difficultySelect = document.getElementById('difficulty');
        difficultySelect.innerHTML = ''; 
        
        // Đổ dữ liệu từ API vào dropdown menu
        for (const [key, config] of Object.entries(LEVELS)) {
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