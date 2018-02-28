/*
Icons dwonloaded from https://icomoon.io/app/#/select
 */
///SVG for icons generated from https://icomoon.io

const iconClass = 'pv3d-svg-icon';
const selector = '.' + iconClass;

const symbols = {
    svgIconSelector: selector
    ,arrowCircleRight: `
                <svg class="${iconClass}" viewBox="0 0 1792 1792" version="1.1" shape-rendering="geometricPrecision" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">            
                <path d="M1413 896q0-27-18-45l-91-91-362-362q-18-18-45-18t-45 18l-91 91q-18 18-18 45t18 45l189 189h-502q-26 0-45 19t-19 45v128q0 26 19 45t45 19h502l-189 189q-19 19-19 45t19 45l91 91q18 18 45 18t45-18l362-362 91-91q18-18 18-45zm251 0q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"/>
                </svg>
            `
    ,arrowCircleLeft: `
                <svg class="${iconClass}" viewBox="0 0 24 28" version="1.1" shape-rendering="geometricPrecision" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">            
                <path d="M20 15v-2c0-0.547-0.453-1-1-1h-7.844l2.953-2.953c0.187-0.187 0.297-0.438 0.297-0.703s-0.109-0.516-0.297-0.703l-1.422-1.422c-0.187-0.187-0.438-0.281-0.703-0.281s-0.516 0.094-0.703 0.281l-7.078 7.078c-0.187 0.187-0.281 0.438-0.281 0.703s0.094 0.516 0.281 0.703l7.078 7.078c0.187 0.187 0.438 0.281 0.703 0.281s0.516-0.094 0.703-0.281l1.422-1.422c0.187-0.187 0.281-0.438 0.281-0.703s-0.094-0.516-0.281-0.703l-2.953-2.953h7.844c0.547 0 1-0.453 1-1zM24 14c0 6.625-5.375 12-12 12s-12-5.375-12-12 5.375-12 12-12 12 5.375 12 12z"></path>
                </svg>
            `
    , controllerPrevious: `
        <svg class="${iconClass}" viewBox="0 0 20 20" version="1.1" shape-rendering="geometricPrecision" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">            
        <path d="M14.959 4.571l-7.203 4.949c0 0-0.279 0.201-0.279 0.481s0.279 0.479 0.279 0.479l7.203 4.951c0.572 0.38 1.041 0.099 1.041-0.626v-9.609c0-0.727-0.469-1.008-1.041-0.625zM6 4h-1c-0.553 0-1 0.048-1 0.6v10.8c0 0.552 0.447 0.6 1 0.6h1c0.553 0 1-0.048 1-0.6v-10.8c0-0.552-0.447-0.6-1-0.6z"></path>
        </svg>    
    `
    , controllerNext: `
        <svg class="${iconClass}" viewBox="0 0 20 20" version="1.1" shape-rendering="geometricPrecision" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">            
        <path d="M12.244 9.52l-7.203-4.949c-0.572-0.383-1.041-0.102-1.041 0.625v9.609c0 0.725 0.469 1.006 1.041 0.625l7.203-4.951c0 0 0.279-0.199 0.279-0.478s-0.279-0.481-0.279-0.481zM14 4h1c0.553 0 1 0.048 1 0.6v10.8c0 0.552-0.447 0.6-1 0.6h-1c-0.553 0-1-0.048-1-0.6v-10.8c0-0.552 0.447-0.6 1-0.6z"></path>
        </svg>    
    `
    , download: `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">
        <path fill="#000" d="M672 448c-19.2 0-32 12.8-32 32v128c0 19.2-12.8 32-32 32h-448c-19.2 0-32-12.8-32-32v-128c0-19.2-12.8-32-32-32s-32 12.8-32 32v128c0 54.4 41.6 96 96 96h448c54.4 0 96-41.6 96-96v-128c0-19.2-12.8-32-32-32z"></path>
        <path fill="#000" d="M361.6 502.4c3.2 3.2 6.4 6.4 9.6 6.4 3.2 3.2 9.6 3.2 12.8 3.2s9.6 0 12.8-3.2c3.2-3.2 6.4-3.2 9.6-6.4l160-160c12.8-12.8 12.8-32 0-44.8s-32-12.8-44.8 0l-105.6 105.6v-307.2c0-19.2-12.8-32-32-32s-32 12.8-32 32v307.2l-105.6-105.6c-12.8-12.8-32-12.8-44.8 0s-12.8 32 0 44.8l160 160z"></path>
    </svg>     
    `
    , createJQSvgIcon: function (def, top, left, width, height) {
        const icon = $(def);
        icon.css('top', top + 'px');
        icon.css('left', left + 'px');
        if (width) icon.css('width', width + 'px');
        if (height) icon.css('height', width + 'px');

        return icon;
    }
};

module.exports = symbols;
