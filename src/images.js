import garden from './assets/images/garden-ceremony.webp';
import coastal from './assets/images/coastal-vows.webp';
import details from './assets/images/heirloom-details.webp';
import moment from './assets/images/a-moment-together.webp';
import married from './assets/images/just-married.webp';
import water from './assets/images/by-the-water.webp';
const images = { 'garden-ceremony': garden, 'coastal-vows': coastal, 'heirloom-details': details, 'a-moment-together': moment, 'just-married': married, 'by-the-water': water };
export const imageFor = name => images[name];
