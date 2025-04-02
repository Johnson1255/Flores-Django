let sound = new Howl({
    src: ['/audios/romantic-saxophone-244539.mp3'],
    loop: true,
    volume: 0.5
});

const musicButton = document.getElementById('musicToggle');
let isPlaying = false;

musicButton.addEventListener('click', () => {
    if (!isPlaying) {
        sound.play();
        musicButton.classList.add('playing');
    } else {
        sound.pause();
        musicButton.classList.remove('playing');
    }
    isPlaying = !isPlaying;
});

// Autoplay con interacción del usuario (opcional)
document.addEventListener('click', function initAudio() {
    if (!isPlaying) {
        sound.play();
        musicButton.classList.add('playing');
        isPlaying = true;
    }
    document.removeEventListener('click', initAudio);
}, { once: true });