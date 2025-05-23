const renderNotFoundPage = () => {
	document.getElementById("content").innerHTML = `
        <div class="not-found">
        <h1>404 Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <a href="#/">Go back to home</a>
        </div>
    `;
};

export default renderNotFoundPage;
