from gui_interface import *
from util import *
from xml.etree import ElementTree
from lxml import etree

# xliff and sdlxliff file management
from translate.storage.xliff import xlifffile
from xml.dom import expatbuilder
import re

from tqdm import tqdm
import os

class TranslatorInterface(TranslatorUI):

    def translate_text(self, texts, source_language, target_language):
        pass
        return []
    def translate(self):

        files = sorted(os.listdir('../smartcat/'))

        for file in tqdm(files):
            xliff_file_path = "../smartcat/" + file
            # some files encording is not utf-8
            try:
                fin = open(xliff_file_path, 'r', encoding='utf-8', errors="ignore")
                data = fin.read()
            except:
                fin = open(xliff_file_path, 'r', encoding='latin-1', errors="ignore")
                data = fin.read()
            self.file_extension = os.path.splitext(file)[-1]

            # xliff file translation
            if (self.file_extension == ".xliff"):
                xliff_file = xlifffile.parsestring(data)
                for node in xliff_file.unit_iter():
                    xml_element = node.xmlelement
                    approve_state = xml_element.get('approved')
                    target_dom = node.target_dom
                    source = node.source_dom.text
                    xml_str = ElementTree.tostring(node.source_dom, encoding='unicode')
                    xml_str = xml_str.replace('ns0:', "")
                    source = re.sub(r'<source[\s\S]*?>([\s\S]*)?<\/source>', r'\1', xml_str)
                    # source = node.source
                    state = target_dom.get('state')
                    print(source)
                    if not self.cross_flag:
                        if xml_element.get('approved') == 'yes' or xml_element.get('translate') == 'no':
                            continue
                    if source == "":
                        translated_source = ""
                    else:
                        translated_source, translated_source_content = self.get_translation(source)

                    if (self.cross_flag):
                        node.setsource(node.target)
                        if xml_element.get('approved') == 'yes' or xml_element.get('translate') == 'no':
                            pass
                        else:
                            node.settarget("")
                    else:
                        try:
                            translated_source = "<test>{}</test>".format(translated_source)
                            transated_target_dom = etree.fromstring(translated_source)
                            print(translated_source)
                        except:
                            translated_source_content = "<test>{}</test>".format(translated_source_content)
                            transated_target_dom = etree.fromstring(translated_source_content)
                            print(translated_source_content)
                        target_dom.text = ""
                        for child in target_dom:
                            target_dom.remove(child)
                        target_dom.text = transated_target_dom.text
                        for child in transated_target_dom:
                            text = child.text
                            target_dom.append(child)
                    xml_element.set('approved', approve_state)
                    target_dom.set('state', state)
                xliff_file.savefile(xliff_file_path)
            else:
                # SDL xliff file translation
                self.mydoc = expatbuilder.parseString(data)
                sdl_segs = self.mydoc.getElementsByTagName('sdl:seg')
                sdl_lock_status = []
                # get segment status
                for sdl_seg in sdl_segs:
                    percent = sdl_seg.getAttribute("percent")
                    conf = sdl_seg.getAttribute("conf")
                    if conf == "Translated" or conf == "Draft":
                        sdl_lock_status.append('true')
                    else:
                        if (percent == "100"):
                            sdl_lock_status.append('true')
                        elif (percent != ''):
                            sdl_lock_status.append('fuzzy')
                        else:
                            sdl_lock_status.append(sdl_seg.getAttribute("locked"))
                # Get all segments
                mrks = self.mydoc.getElementsByTagName('mrk')
                target_contents = []
                source_index = 0
                target_index = 0
                if not self.cross_flag:
                    index = -1
                    for mrk in mrks:
                        index += 1
                        mtype = mrk.getAttribute("mtype")
                        if (mtype != "seg"):
                            continue
                        try:
                            parent_node_name = get_parent_nodename(mrk)
                            if (parent_node_name == "seg-source"):
                                mtype = mrk.getAttribute("mtype")
                                if mtype == "seg":
                                    if sdl_lock_status[source_index] == 'true':
                                        source_index += 1
                                        continue
                                    str = mrk.toxml()

                                    print("Source:", str)
                                    target_str, target_context = self.get_translation(str)
                                    print("target:", target_str)
                                    if str == target_str:
                                        sdl_segs[int(index/2)].setAttribute("conf",'Translated')
                                    try:
                                        mrk_doc = expatbuilder.parseString(target_str, False)
                                    except:
                                        mrk_doc = expatbuilder.parseString(target_context, False)
                                    node_list = []
                                    new_mrk = mrk_doc._get_firstChild()
                                    source_child_nodes = new_mrk.childNodes
                                    for node in source_child_nodes:
                                        node_list.append(node)
                                    target_contents.append(node_list)
                                    source_index += 1
                                else:
                                    continue
                            else:
                                if sdl_lock_status[target_index] == "true":
                                    target_index += 1
                                    continue
                                while mrk.firstChild:
                                    mrk.removeChild(mrk.firstChild)
                                try:
                                    node_list = target_contents.pop(0)
                                    for node in node_list:
                                        mrk.appendChild(node)
                                    target_index += 1
                                except:
                                    # For this case
                                    '''
                                        <seg-source>
                                            <mrk mtype="seg" mid="149">9,500</mrk>
                                        </seg-source>
                                        <target>
                                            <mrk mtype="seg" mid="149">
                                            <mrk mtype="x-sdl-location" mid="4b649a57-2bd9-46ee-9aec-17f1963fc9fb"/>
                                            <mrk mtype="x-sdl-location" mid="95806ff5-ab16-47a0-8e55-d2f88235d79e"/>
                                            <mrk mtype="x-sdl-location" mid="04d62dac-35e9-47c2-b3d1-b01fd4ad7ea0"/>9,500 ปี
                                            <mrk mtype="x-sdl-location" mid="0afaca82-351a-4f61-9358-7c6482ebd2b2"/></mrk>
                                        </target>
                                    '''
                                    pass
                        except Exception as error:
                            print("Translation error ==========>", error)
                            pass
                else:
                    # SDL sliff file translation
                    for mrk in mrks:
                        mtype = mrk.getAttribute("mtype")
                        if (mtype != "seg"):
                            continue
                        try:
                            parent_node_name = get_parent_nodename(mrk)
                            if (parent_node_name == "seg-source"):
                                if (parent_node_name == "seg-source"):
                                    mtype = mrk.getAttribute("mtype")
                                    if mtype == "seg":
                                        str = mrk.toxml()
                                        print("source: ", str)
                                        mrk_doc = expatbuilder.parseString(str)
                                        node_list = []
                                        new_mrk = mrk_doc._get_firstChild()
                                        for node in new_mrk.childNodes:
                                            node = self.translate_node(node)
                                            node_list.append(node)
                                        while mrk.firstChild:
                                            mrk.removeChild(mrk.firstChild)
                                        for node in node_list:
                                            mrk.appendChild(node)
                                        source_index += 1
                                    else:
                                        continue
                            else:
                                if sdl_lock_status[target_index] != "fuzzy" and sdl_lock_status[target_index] != "true":
                                    while mrk.firstChild:
                                        mrk.removeChild(mrk.firstChild)
                                target_index += 1
                        except:
                            pass
                with open(xliff_file_path, "w", encoding="utf-8") as xml_file:
                    self.mydoc.writexml(xml_file, )


    def get_translation(self, str):
        old_str = str
        if (str == ''):
            return ''
        if uri_validator(str):
            return str, str
        str = change_string(str)
        str_list = str.split("\n\n\n\n\n\n")
        target = ""
        target_context = ""
        global tag_list
        for individual_str in str_list:
            individual_str = individual_str.strip()
            if (len(individual_str) < 1):
                continue
            source_len = len(individual_str)
            translation_str, tag_list = convert_tag(individual_str)
            content_text = convert_content_text(individual_str)

            translation_res = self.translate_text([translation_str, content_text], self.source_language_code,
                                                     self.target_language_code)
            target_text_content = translation_res[0]
            translated_text_content = translation_res[1]

            if self.target_language_code == 'th':
                target_text_content = convert_segment(self.file_extension,target_text_content)
                translated_text_content = convert_segment(self.file_extension,translated_text_content)
            target_text_content = self.re_convert_tag(target_text_content, tag_list)
            # list with only mrk tag
            try:
                context_tag_list = [tag_list[0]]
            except:
                # for xliff file translate.
                context_tag_list = []

            translated_text_content = self.re_convert_tag(translated_text_content, context_tag_list)
            if (source_len > 1):
                target += "\n" + target_text_content
                target_context += "\n" + translated_text_content
            else:
                target += "\n" + individual_str
                target_context += "\n" + individual_str
            target = change_again(target)
            target_context = change_again(target_context)
        target = target[1:]
        target_context = target_context[1:]
        if (target == ""):
            target = " "
        if (target_context == ""):
            target_context = " "
        slash_target = convert_slash(self.file_extension,target)
        target_result = space_maker(tag_list, old_str, slash_target)

        slash_target_content = convert_slash(self.file_extension,target_context)
        target_result_content = space_maker(tag_list, old_str, slash_target_content)
        return target_result, target_result_content
    def re_convert_tag(self, str, tag_list):

        str = convert_special_charector(str)
        index = -1
        for tag in tag_list:
            index += 1
            try:
                xid = get_xid_from_str(tag)
                if xid:
                    trans_units = self.mydoc.getElementsByTagName("trans-unit")
                    for unit in trans_units:
                        unit_id = unit.getAttribute("id")
                        if unit_id == xid:
                            unit_parent = unit.parentNode
                            newxid = generate_xid()
                            unit.setAttribute("id", newxid)
                            node_str = unit.toxml()
                            unit.setAttribute("id", xid)
                            clone_unit = expatbuilder.parseString(node_str, False)._get_firstChild()
                            unit_parent.insertBefore(clone_unit, unit)
                            tag = tag.replace(xid, newxid)
                            break
            except:
                pass
            str = str.replace("[ t{}]".format(index), tag)
            str = str.replace("[ t {}]".format(index), tag)
            str = str.replace("[t {}]".format(index), tag)
            str = str.replace("[t{}]".format(index), tag)
            str = str.replace("[{}t]".format(index), tag)
            str = str.replace("[{}t ]".format(index), tag)
            str = str.replace("[{} t ]".format(index), tag)
            str = str.replace("[{} t]".format(index), tag)
            str = str.replace("[t{}t ]".format(index), tag)
            str = str.replace("[t{} t ]".format(index), tag)
            str = str.replace("[t{} t]".format(index), tag)
            str = str.replace("[ t{}t]".format(index), tag)
            str = str.replace("[ t {}t]".format(index), tag)
            str = str.replace("[t {}t]".format(index), tag)
            str = str.replace("[t{}t]".format(index), tag)

        return str

