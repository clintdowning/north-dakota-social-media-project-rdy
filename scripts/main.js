$(document).ready(function() {
    const maxDaysPerRequest = 3;
    const totalDays = 9;
    const apiUrl = 'https://apps.und.edu/demo/public/index.php/post';
    let allPosts = [];
    let loadedPosts = 0;
    const postsPerBatch = 20;

    function fetchPosts() {
        const today = new Date();
        let promises = [];

        for (let i = 0; i < totalDays; i += maxDaysPerRequest) {
            let fromDate = new Date();
            fromDate.setDate(today.getDate() - (i + maxDaysPerRequest - 1));
            let toDate = new Date();
            toDate.setDate(today.getDate() - i);

            if (toDate > today) {
                toDate = today;
            }

            let fromDateString = fromDate.toISOString().split('T')[0];
            let toDateString = toDate.toISOString().split('T')[0];

            let request = $.ajax({
                url: apiUrl,
                method: 'GET',
                dataType: 'json',
                data: {
                    from: fromDateString,
                    to: toDateString
                }
            });

            promises.push(request);
        }

        $.when(...promises).done(function(...responses) {
            if (promises.length === 1) {
                responses = [responses];
            }

            responses.forEach(function(response) {
                let data = response[0];
                allPosts = allPosts.concat(data);
            });

            allPosts.sort(function(a, b) {
                return new Date(b.date) - new Date(a.date);
            });

            console.log("allPosts: ", allPosts);

            loadMorePosts();
        }).fail(function(error) {
            console.error('Error fetching posts:', error);
        });
    }

    $('#clear-search').click(function(){
        $('#search-input').val('');
        $(this).addClass('empty');
        const loadedBatch = allPosts.slice(0, loadedPosts);
        displayPosts(loadedBatch);
    });
    
    function loadMorePosts() {
        const postsContainer = $('#posts-container');
        let nextBatch = allPosts.slice(loadedPosts, loadedPosts + postsPerBatch);
    
        nextBatch.forEach(function(post) {
            const postElement = $(createPostElement(post));
            postElement.css('display', 'none');
            postsContainer.append(postElement);
            postElement.fadeIn(500);
        });
    
        loadedPosts += nextBatch.length;
    
        if (loadedPosts >= allPosts.length) {
            $(window).off('scroll', handleScroll);
        }
    }
        
    function highlightMatch(message, query) {
        if (!query) return escapeHtml(message);
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        const highlightedMessage = message.replace(regex, '<span class="highlight">$1</span>');
        return highlightedMessage;
    }
    
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function escapeHtml(text) {
        return $('<div>').text(text).html();
    }
        
    function createPostElement(post, query = '') {
        let postHtml = '';
        $.ajax({
            url: 'templates/post.html',
            async: false,
            success: function(data) {
                postHtml = $(data);
            }
        });

        // UTC Date Time
        const localDate = new Date(post.date + 'Z');

        // User Date Time
        const formattedDate = localDate.toLocaleString();
        const month = localDate.toLocaleString('en-US', { month: 'short' });
        const day = localDate.getDate();
        const year = localDate.getFullYear();
        const time = localDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

        postHtml.find('.post-author-image').attr('src', post.image).attr('alt', post.author);
        postHtml.find('.post-author-name').text(post.author);

        postHtml.find('.calendar-format .month').text(month);
        postHtml.find('.calendar-format .day').text(day);
        postHtml.find('.calendar-format .year').text(year);
        postHtml.find('.calendar-format .time').text(time);
        
        postHtml.find('.post-message').html(highlightMatch(post.message, query));
        postHtml.find('.likes-count').text(post.likes);
        postHtml.find('.likes .bar').css("width", post.likes / 2 + "px");
        postHtml.find('.reposts-count').text(post.reposts);
        postHtml.find('.reposts .bar').css("width", post.reposts / 2 + "px");
        return postHtml.prop('outerHTML');
    }   
            
    function displayPosts(posts, query = '') {
        const postsContainer = $('#posts-container');
        postsContainer.empty();
    
        if (posts.length === 0) {
            postsContainer.append('<p class="info">No posts found.</p>');
            $('#posts-container').addClass('empty');
            return;
        } else {
            $('#posts-container').removeClass('empty');
        }
    
        posts.forEach(function(post) {
            const postElement = $(createPostElement(post, query));
            postElement.css('display', 'none');
            postsContainer.append(postElement);
            postElement.fadeIn(500);
        });
    }
    
    $('#search-input').on('input', function () {
        const query = $(this).val().toLowerCase();
        if(query.length >= 1){
            $('#clear-search').removeClass('empty');
        } else {
            $('#clear-search').addClass('empty');
        }
        if (query.length >= 3) {
            const filteredPosts = allPosts.filter(function (post) {
                return post.message.toLowerCase().includes(query);
            });
            displayPosts(filteredPosts, query);
        }
    });
    
    fetchPosts();

    // Post Loading
    //$(window).on('scroll', handleScroll);

    function handleScroll() {
        if ($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
            loadMorePosts();
        }
    }

    $('#load-more').click(function(){
        loadMorePosts();
    });

    $('.mobile-header .top .menu-btn').click(function(){
        $('.mobile-menu').toggleClass("inactive active");
    });
});
