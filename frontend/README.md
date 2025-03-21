
# Focus Peaking Visualizer

A modern web application that demonstrates focus peaking on video content. This application highlights areas of high contrast in a video, which typically correspond to areas that are in sharp focus, helping photographers and videographers identify which parts of a frame are properly focused.

## Screenshots

![Focus Peaking Enabled](screenshots/focus-peaking-on.png)
![Focus Peaking Disabled](screenshots/focus-peaking-off.png)

## Features

- Video playback with focus peaking overlay
- Toggle focus peaking on/off
- Customizable highlight colors (red, green, blue, yellow, white)
- Adjustable sensitivity threshold
- Clean, modern UI with responsive design

## Technical Details

This application uses a Sobel operator for edge detection to identify areas of high contrast. These edges are then highlighted with a colored overlay to indicate areas in sharp focus.

### Technology Stack

- **Frontend**: React.js with TypeScript
- **UI Library**: ShadCN UI
- **Styling**: Tailwind CSS
- **Video Processing**: HTML5 Canvas API

## Installation

### Prerequisites

- Node.js v20.10.0 or newer

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/focus-peaking-visualizer.git
   cd focus-peaking-visualizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Download the sample video and place it in the `public` directory as `sample.mp4`:
   - Download from: https://drive.google.com/file/d/1h0vtWUQvB3bjYyGRKsDpHyVKVpz5jEnJ/view?usp=drive_link
   - Save as: `public/sample.mp4`

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

## How to Use

1. **Play/Pause Video**: Click on the video or use the play/pause button in the control bar
2. **Toggle Focus Peaking**: Click the eye icon in the control panel or use the switch
3. **Change Highlight Color**: Select from the color options in the control panel
4. **Adjust Sensitivity**: Click the settings icon and use the slider to adjust the threshold

## Implementation Approach

The focus peaking effect is implemented using the following approach:

1. Each video frame is captured and drawn to a canvas
2. The Sobel operator is applied to detect edges in the frame
3. Areas exceeding the threshold are highlighted with the selected color
4. The resulting overlay is displayed on top of the video

The application uses requestAnimationFrame to process each frame efficiently, ensuring smooth performance.

## Customization

- **Threshold**: Lower values detect more edges but may include noise, higher values focus on stronger edges only
- **Highlight Colors**: Choose from preset colors or modify the code to add custom colors

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Design inspired by modern camera interfaces and minimalist UI principles
- Built with React and ShadCN UI components
