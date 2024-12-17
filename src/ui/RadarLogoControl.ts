const RADAR_LOGO_URL = 'https://api.radar.io/maps/static/images/logo.svg';

class RadarLogoControl {
  link: HTMLAnchorElement | undefined;

  onAdd() {
    const img = document.createElement('img');
    img.src = RADAR_LOGO_URL;
    img.alt = 'Radar Maps Platform';

    this.link = document.createElement('a');
    this.link.id = 'radar-map-logo';
    this.link.href = 'https://radar.com?ref=powered_by_radar';
    this.link.target = '_blank';
    this.link.style.pointerEvents = "auto";
    this.link.appendChild(img);

    return this.link;
  }

  onRemove() {
    this.link?.remove();
  }
}

export default RadarLogoControl;