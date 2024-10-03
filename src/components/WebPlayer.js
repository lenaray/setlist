import SpotifyPlayer from 'react-spotify-web-playback';

const SpotifyMusicPlayer = ({ accessToken, followedArtists }) => {
    return (
        <div className={styles.spotifyPlayer}>
            <h3>Now Playing:</h3>
            {accessToken && (
                <SpotifyPlayer
                    token={accessToken}
                    uris={followedArtists.map(artist => artist.uri)}
                    autoPlay={true}
                    play={true}
                />
            )}
        </div>
    );
};

export default SpotifyMusicPlayer;