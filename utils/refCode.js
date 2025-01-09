


// Replace existing line with:
const generateRefCode = (username) => {
    const prefix = username.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).slice(-3);
    const randomNum = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${timestamp}${randomNum}`;
};
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export {generateRefCode, generateUUID};


// Usage:
// const refCode = generateRefCode("username");
// console.log(refCode)