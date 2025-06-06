"use strict";
function getRandNums() {
    const length = Math.floor(Math.random() * 3) + 2;
    return Array.from({ length }, () => Math.floor(Math.random() * 11));
}
;
console.log(getRandNums());
