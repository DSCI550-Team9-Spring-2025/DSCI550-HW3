import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const imageData = [
  {
    src: process.env.PUBLIC_URL + "/images/image_1.png",
    caption: "Ada witch - Sometimes you can see a misty blue figure floating within a 3-mile radius of the Ada Cemetery on 2 Mile between Egypt Valley and Honey Creek. The story of her origin is as follows: A man suspected his wife of having an affair, so he followed her late one night when she thought he was asleep. Sure enough, she went to a field near their property where she met her lover. The husband was enraged and killed his wife, which resulted in a struggle with the other man. Both men died from their injuries. It is said that late at night (especially during the night of and the nights preceding a full moon) people driving by the field can see her ghost, searching for her lover. Some people have reported stopping to try to communicate with her, but she always disappears or runs into the woods where she cannot be followed (due to the thick brambles that inhabit the area). She is said to dress in a long white gown which authorities say dates her to the turn of the 20th century. Usually she is seen alone, but sometimes witnesses report seeing a ghostly death scene re-enacted... Others report seeing nothing at all but hearing the killer's shouts of rage followed by the victims' screams of agony... Although it is said she haunts the field on Honeycreek Road where she died, other witnesses have reported her in nearby Seidman Park, and in nearby Findlay Cemetery, where she is supposedly buried. This story was actually featured in the book 'Ghosts of Grand Rapids.'"
  },
  {
    src: process.env.PUBLIC_URL + "/images/image_70.png",
    caption: "Closed Down- Sightings of people around the cinema. scratching and bumping noises heard every night. Shadows of people running on the screen. Little girl sits on the stage."
  },
  {
    src: process.env.PUBLIC_URL + "/images/image_165.png",
    caption: "Around 7:30pm every night at Garden City High School you can hear howling and screaming coming from the tennis courts. These sounds are said to be because a dog killed a little girl back in the 1800's. The tennis courts took over the exact spot."
  },
  {
    src: process.env.PUBLIC_URL + "/images/image_482.png",
    caption: "In one of the bathrooms it is rumor that when the school was a high school someone died, and now you will see him in mirrors, or feel his presence in the stalls."
  },
  {
    src: process.env.PUBLIC_URL + "/images/image_512.png",
    caption: "An old man, believed to be in his 90's appears in the basement boiler room just above the man boiler. He has no body, just a head. If you rattle the keys near the door you stand a good chance of spotting him. Most think that he was once the school's/church's janitor.."
  },
];

const ImageCarousel = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    fade: true,
    autoplay: true,
    autoplaySpeed: 12000,
    arrows: true
  };

  return (
    <div className="carousel-wrapper">
      <Slider {...settings}>
        {imageData.map((img, idx) => (
          <div key={idx} className="carousel-slide">
            <img src={img.src} alt={`Sighting ${idx + 1}`} />
            <div className="carousel-caption">{img.caption}</div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ImageCarousel;