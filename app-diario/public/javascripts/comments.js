async function submitComment(postId,email){
    const input = document.getElementById('w3-input-comment');
    const commentText = input.value.trim();

    if (commentText.length === 0) return;

    try{
        const resp = await axios.post(`http://localhost:3000/api/diary/${postId}/comments`,{
            user: email || 'Admin',
            text: commentText,
            createdAt: new Date().toISOString()
        },
        {
            withCredentials: true,
        }
    );
        location.reload();
    } catch(err){
        console.error('Erro ao adicionar comentário:', err);
        alert('Erro ao enviar comentário.');
    }
}