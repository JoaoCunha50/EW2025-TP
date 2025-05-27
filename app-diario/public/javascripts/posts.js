async function submitEdit(post) {
    if (confirm('Deseja guardar alterações?')) {
        try {
            const titleElement = document.getElementById('title');
            const contentElement = document.getElementById('content');
            const fileInput = document.getElementById('file');
            const isPublicElement = document.getElementById('isPublic');

            if (titleElement.value !== '') {
                post.title = titleElement.value;
            }

            if (contentElement.value !== '') {
                post.content = contentElement.value;
            }

            if (isPublicElement) {
                post.isPublic = isPublicElement.checked;
            }

            if (window.filesToDelete && window.filesToDelete.length > 0) {
                post.filesToDelete = window.filesToDelete;
            }

            const formData = new FormData();

            if (fileInput.files.length > 0) {
                formData.append('file', fileInput.files[0]);
            }
            formData.append('post', JSON.stringify(post));

            const response = await axios.put(`http://localhost:3000/api/diary/${post._id}`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 200) {
                alert('Post atualizado com sucesso!');
                window.location.href = '/admin';
            }
        } catch (error) {
            console.error('Erro ao atualizar post:', error);
            alert(error.message || 'Erro ao atualizar post. Tente novamente.');
        }
    }
}

async function deletePost(id) {
    if (confirm('Tem certeza de que deseja excluir este post?')) {
        try {
            const response = await axios.delete(`http://localhost:3000/api/diary/${id}`, {
                withCredentials: true,
            })
                
            if (response.status === 200) {
                alert('Post excluído com sucesso!');
                window.location.href = '/admin';
            }
        } catch (error) {
            console.error('Erro ao excluir post:', error);
            alert('Erro ao excluir post. Tente novamente.');
        }
    } else {
        console.log("User cancelled deletion");
    }
}