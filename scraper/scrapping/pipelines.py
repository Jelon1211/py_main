# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
# scrapping/pipelines.py

from itemadapter import ItemAdapter
from database import DatabaseManager

class ScrappingPipeline:
    def open_spider(self, spider):
        self.db_manager = DatabaseManager()
        self.db_manager.connect()
        print("Pipeline opened - connection established.")

    def close_spider(self, spider):
        self.db_manager.close()
        print("Pipeline closed - connection terminated.")

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        
        # Dodajemy komunikaty diagnostyczne
        print('item ----->', item)

        health_check_query = "CALL health_check()"
        self.db_manager.fetch_one(health_check_query)
        
        return item

