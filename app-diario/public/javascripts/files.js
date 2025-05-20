(function() {
    const filesToDelete = [];
    
    document.querySelectorAll('.mark-delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
            const filename = this.getAttribute('data');
            const container = document.querySelector(`.file-container[data="${filename}"]`);
            
            const index = filesToDelete.indexOf(filename);
            
            if (index === -1) {
                // Marca para exclusão
                filesToDelete.push(filename);
                container.style.opacity = '0.5';
                container.style.border = '2px solid #ef4444';
            } else {
                // Remove da lista de exclusão
                filesToDelete.splice(index, 1);
                container.style.opacity = '1';
                container.style.border = 'none';
            }
        });
    });

    window.filesToDelete = filesToDelete
})();