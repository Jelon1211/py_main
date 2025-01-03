import scrapy

class ExampleSpider(scrapy.Spider):
    name = "example_spider"
    allowed_domains = ["animenewsnetwork.com"]
    start_urls = ["https://www.animenewsnetwork.com"]

    def parse(self, response):
        mainfeed_div = response.css('div#mainfeed')
        mainfeed_class = mainfeed_div.css('div.mainfeed-day')
        herald_boxes = mainfeed_class.css('div.mainfeed-section.herald-boxes')
        
        news_divs = herald_boxes.css('div.herald.box:not(.video.t-video)')
        
        for div in news_divs:

            a_heading = div.css('h3 a')

            topic_text = a_heading.xpath('string(.)').get()

            link = a_heading.attrib.get('href')

            yield response.follow(link, callback=self.parse_detail, meta={'topic': topic_text})

    def parse_detail(self, resposne):
        topic = resposne.meta['topic']

        main_content = resposne.css('div#maincontent')

        content = main_content.css('div.KonaBody')

        paragraph = content.css('p')

        content_plain = paragraph.xpath('string(.)').get()

        yield {
            'topic': topic,
            'content': content_plain,
            'url': resposne.url
        }



