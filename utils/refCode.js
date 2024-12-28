


// Replace existing line with:
const generateRefCode = (username) => {
    const prefix = username.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).slice(-3);
    const randomNum = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${timestamp}${randomNum}`;
};


export {generateRefCode};


// Usage:
// const refCode = generateRefCode("username");
// console.log(refCode)