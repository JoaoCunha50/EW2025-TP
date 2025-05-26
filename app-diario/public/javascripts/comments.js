async function submitComment(postId,token,email){
    const input = document.getElementById('w3-input-comment');
    const commentText = input.value.trim();

    if (commentText.length === 0) return;

    try{
        const resp = await axios.post(`http://localhost:3000/api/diary/${postId}/comments`,{
            user: email,
            text: commentText,
            createdAt: new Date().toISOString()
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        location.reload();
    } catch(err){
        console.error('Erro ao adicionar comentário:', err);
        alert('Erro ao enviar comentário.');
    }
}