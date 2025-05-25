document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const tagFilter = document.getElementById('tagFilter');
    const postCards = document.querySelectorAll('.w3-col.l4.m6');

    function filterPosts() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedTag = tagFilter.value.toLowerCase();

        postCards.forEach(card => {
            const title = card.querySelector('.w3-xlarge').textContent.toLowerCase();
            const tagsText = card.querySelector('#postTags').textContent;
            const postTags = tagsText.replace('Tags: ', '').split(', ').map(tag => tag.toLowerCase());
            
            const matchesSearch = title.includes(searchTerm);
            const matchesTag = !selectedTag || postTags.includes(selectedTag);

            card.style.display = (matchesSearch && matchesTag) ? '' : 'none';
        });
    }

    searchInput.addEventListener('input', filterPosts);
    tagFilter.addEventListener('change', filterPosts);
});