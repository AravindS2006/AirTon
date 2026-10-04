document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const imageUploadInput = document.getElementById('image-upload');
    const dropArea = document.getElementById('drop-area');
    const analyzeButton = document.getElementById('analyze-button');
    const progressBar = document.getElementById('progress-bar');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const uploadStatus = document.getElementById('upload-status');

    // Mobile Menu Toggle
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Drag and Drop Functionality
    if (dropArea && imageUploadInput && analyzeButton) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            dropArea.classList.add('bg-gray-700', 'border-teal-500');
        }

        function unhighlight(e) {
            dropArea.classList.remove('bg-gray-700', 'border-teal-500');
        }

        dropArea.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            let dt = e.dataTransfer;
            let files = dt.files;
            handleFiles(files);
        }

        imageUploadInput.addEventListener('change', handleInputChange);

        function handleInputChange() {
            const files = imageUploadInput.files;
            handleFiles(files);
        }

        function handleFiles(files) {
            if (files && files[0]) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    dropArea.innerHTML = `<p class="text-gray-300"><i data-heroicons="check-circle" class="inline-block h-5 w-5 text-teal-500 mr-2"></i>Image Selected: ${file.name}</p>`;
                    analyzeButton.disabled = false;
                } else {
                    dropArea.innerHTML = `<p class="text-red-500"><i data-heroicons="exclamation-circle" class="inline-block h-5 w-5 text-red-500 mr-2"></i>Invalid File Type. Please upload an image.</p>`;
                    analyzeButton.disabled = true;
                }
            }
        }

        analyzeButton.addEventListener('click', () => {
            // Simulate analysis progress (Replace with actual Streamlit integration)
            progressBar.classList.remove('hidden');
            uploadStatus.classList.remove('hidden');
            uploadStatus.innerText = "Analyzing image...";
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                progressBarFill.style.width = `${progress}%`;
                if (progress >= 100) {
                    clearInterval(interval);
                    uploadStatus.innerText = "Analysis complete. Redirecting to results...";
                    // Replace with actual redirection to results page in your Streamlit app
                    setTimeout(() => {
                        uploadStatus.innerText = "Analysis complete."; // Keep a static message
                        // window.location.href = '/results'; // Uncomment and adjust for actual redirection
                    }, 1500);
                }
            }, 100); // Adjust timing as needed for visual feedback
        });
    }
});