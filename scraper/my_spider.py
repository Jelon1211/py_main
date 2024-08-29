from insert_mysql import insert_article
import scrapy

class AnimeNewsSpider(scrapy.Spider):
    name = "anime_news"
    start_urls = ['https://www.animenewsnetwork.com/']

    def parse(self, response):
        topfeed_div = response.css('div#topfeed')

        for article in topfeed_div.css('div.herald.box.news'):
            link = article.css('div.thumbnail a::attr(href)').get()

            if link:
                full_url = response.urljoin(link)
                yield scrapy.Request(url=full_url, callback=self.parse_article)

    def parse_article(self, response):
        title = response.css('div#page-title h1::text').getall()
        title = ''.join(title).strip()
        title = ' '.join(title.split())

        content_structure = []
        for element in response.css('div.meat').xpath('*'):
            if element.root.tag == 'p':
                text = element.css('::text').getall()
                text = ' '.join(text).strip()
                if text:
                    content_structure.append({'content': text})
            elif element.root.tag == 'iframe':
                iframe_src = element.css('::attr(src)').get()
                if iframe_src:
                    content_structure.append({'iframe': iframe_src})
            elif element.root.tag == 'figure':
                img_src = element.css('img::attr(src)').get()
                if img_src:
                    content_structure.append({'img': img_src})

        insert_article(title, content_structure)
        


        yield {
            'title': title,
            'content': content_structure,
        }