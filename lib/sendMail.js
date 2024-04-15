export async function sendEmail(data) {
    const apiEndpoint = '/api/email';
    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        const responseData = await response.json();
        return { message: "Your message sent successfully !" }
    } catch (err) {
        console.log(err);
        return { message: "Something went wrong !" }
    }
}