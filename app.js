document.addEventListener('DOMContentLoaded', () => {
    const dom = {
        fileInput: document.getElementById('fileInput'),
        previewPanel: document.getElementById('previewPanel'),
        previewGrid: document.getElementById('previewGrid'),
        fileCount: document.getElementById('fileCount'),
        clearBtn: document.getElementById('clearBtn'),
        convertBtn: document.getElementById('convertBtn'),
        loadingOverlay: document.getElementById('loadingOverlay')
    };

    let files = [];

    // 文件处理
    const handleFiles = (newFiles) => {
        const validFiles = Array.from(newFiles).filter(file => 
            /^image\/(jpeg|png|webp)/.test(file.type)
        );
        
        if (validFiles.length === 0) {
            alert('仅支持 JPG/PNG/WebP 格式');
            return;
        }
        
        files = [...files, ...validFiles];
        updatePreview();
    };

    // 预览更新
    const updatePreview = () => {
        dom.previewPanel.style.display = files.length ? 'block' : 'none';
        dom.fileCount.textContent = files.length;
        dom.previewGrid.innerHTML = '';
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = e => {
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-btn" data-index="${index}">×</button>
                `;
                dom.previewGrid.appendChild(item);
            };
            reader.readAsDataURL(file);
        });
    };

    // 事件监听
    dom.fileInput.addEventListener('change', () => handleFiles(dom.fileInput.files));
    
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    });

    dom.previewGrid.addEventListener('click', e => {
        if (e.target.classList.contains('remove-btn')) {
            files.splice(e.target.dataset.index, 1);
            updatePreview();
        }
    });

    dom.clearBtn.addEventListener('click', () => {
        files = [];
        dom.fileInput.value = '';
        updatePreview();
    });

    dom.convertBtn.addEventListener('click', async () => {
        if (files.length === 0) return alert('请选择图片文件');
        
        try {
            dom.loadingOverlay.classList.add('active');
            const pdf = new jspdf.jsPDF();
            
            for (const [i, file] of files.entries()) {
                const img = await loadImage(file);
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
                
                if (i > 0) pdf.addPage();
                
                pdf.addImage(img, 'JPEG', 
                    (pageWidth - img.width * ratio) / 2,
                    (pageHeight - img.height * ratio) / 2,
                    img.width * ratio,
                    img.height * ratio
                );
            }
            
            pdf.save(`图片转换_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
        } catch (error) {
            alert(`转换失败: ${error.message}`);
        } finally {
            dom.loadingOverlay.classList.remove('active');
        }
    });

    const loadImage = (file) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
});