function editPost(id) {
    window.location.href = `/admin/post/${id}`;
}

async function submitEdit(post) {
    if (confirm('Deseja guardar alterações?')) {
        try {
            const titleElement = document.getElementById('title');
            const contentElement = document.getElementById('content');
            const fileInput = document.getElementById('files');
            
            if (!titleElement || !contentElement) {
                throw new Error('Elementos do formulário não encontrados');
            }
            if(titleElement) {
                post.title = titleElement.value
            }

            if(contentElement) {
                post.content = contentElement.value
            }

            const response = await axios.put(`http://localhost:3000/api/diary/${post._id}`, post);

            if (response.status === 200) {
                window.location.href = '/admin';
                alert('Post atualizado com sucesso!');
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
            const response = await axios.delete(`http://localhost:3000/api/diary/${id}`);
            
            if (response.status === 200) {
                alert('Post excluído com sucesso!');
                window.location.reload();
            }
        } catch (error) {
            console.error('Erro ao excluir post:', error);
            alert('Erro ao excluir post. Tente novamente.');
        }
    } else {
        console.log("User cancelled deletion");
    }
}