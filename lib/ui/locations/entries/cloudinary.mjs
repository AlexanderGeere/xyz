const types = {
    images,
    documents
}

const onload = {
    images: imageLoad,
    documents: docLoad
}

export default entry => types[entry.type](entry)

function images(entry) {

    const images = entry.value?.map(image => {

        const trashBtn = mapp.utils.html`
        <button
            class="mask-icon trash no"
            data-name=${image.replace(/^.*\//, '').replace(/\.([\w-]{3})/, '')}
            data-src=${image}
            onclick=${e => trash(e, entry)}>`
        
        return mapp.utils.html`
        <div>
        <img 
            src=${image}
            onclick=${mapp.ui.utils.imagePreview}>
            ${(entry.edit) && trashBtn}`
        }) || []

    if (entry.edit) images.push(mapp.utils.html.node`
        <div class="mask-icon add-photo pos-center">
        <input
            type="file"
            accept="image/*;capture=camera"
            onchange=${e => upload(e, entry)}>`)

    if (!images.length) return;

    entry.list = mapp.utils.html.node`<div class="images-grid">${images}`

    return entry.list;
}

function documents(entry) {

    const docs = entry.value?.map(doc => {

        const trashBtn = mapp.utils.html`
        <button
            class="mask-icon trash no"
            data-name=${doc.replace(/^.*\//, '').replace(/\.([\w-]{3})/, '')}
            data-href=${doc}
            onclick=${e => trash(e, entry)}>`

        return mapp.utils.html`
        <div class="link-with-img">
            ${(entry.edit) && trashBtn}
            <a
                target="_blank"
                href=${doc}>${doc.replace(/^.*\//, '').replace(/\.([\w-]{3})/, '')}`
        }) || []

    entry.uploadBtn = mapp.utils.html.node`
    <div class="mask-icon cloud-upload">
        <input
            style="opacity: 0; width: 3em; height: 3em;"
            type="file"
            accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document;"
            onchange=${e => upload(e, entry)}>`

    entry.edit && docs.push(entry.uploadBtn)

    if (!docs.length) return;

    entry.list = mapp.utils.html.node`<div>${docs}`

    return entry.list;
}

async function upload(e, entry) {

    // Location view must disabled while uploading resource.
    entry.location.view?.classList.add('disabled')

    const reader = new FileReader()

    if (!e.target.files[0]) return;

    entry.file = e.target.files[0]

    reader.onload = e => onload[entry.type](e, entry)

    reader.readAsDataURL(entry.file)
}

function imageLoad(e, entry){

    const img = new Image()

    img.onload = async () => {

        let
            canvas = mapp.utils.html.node`<canvas>`,
            max_size = 1024,
            width = img.width,
            height = img.height

        // resize
        if (width > height && width > max_size) {
            height *= max_size / width
            width = max_size

        } else if (height > max_size) {
            width *= max_size / height
            height = max_size
        }

        canvas.width = width
        canvas.height = height

        canvas.getContext('2d').drawImage(img, 0, 0, width, height)

        const dataURL = canvas.toDataURL('image/jpeg', 0.5)

        const public_id = entry.file.name.replace(/^.*\//, '').replace(/\.([\w-]{3})/, '') + entry.suffix_date ? `@${Date.now()}` : '';

        const response = await mapp.utils.xhr({
            method: 'POST',
            requestHeader: {
                'Content-Type': 'application/octet-stream'
            },
            url: `${entry.location.layer.mapview.host}/api/provider/cloudinary?${mapp.utils.paramString({
                public_id,
                resource_type: 'image',
                folder: entry.cloudinary_folder
            })}`,
            body: mapp.utils.dataURLtoBlob(dataURL)
        })

        if (!response || response.error) {
            const errorDetail = response?.error?.message ? ` Error: ${response.error.message}` : '';
            const errorMessage = `Cloudinary Image upload failed!${errorDetail}`;
            alert(errorMessage);
            return;
        }

        // Add the secure_url to the entry values array and update the location.
        entry.value = Array.isArray(entry.value) ? entry.value.concat([response.secure_url]) : [response.secure_url]

        postUpdate(entry)
    }

    img.src = e.target.result
}

async function docLoad(e, entry) {

    const response = await mapp.utils.xhr({
        method: 'POST',
        requestHeader: {
            'Content-Type': 'application/octet-stream'
        },
        url: `${entry.location.layer.mapview.host}/api/provider/cloudinary?${mapp.utils.paramString({
            public_id: entry.file.name,
            resource_type: 'raw',
            folder: entry.cloudinary_folder
        })}`,
        body: e.target.result
    })

    if (!response || response.error) {
        const errorDetail = response?.error?.message ? ` Error: ${response.error.message}` : '';
        const errorMessage = `Cloudinary document upload failed!${errorDetail}`;
        alert(errorMessage);
        return;
    }
    // Add the secure_url to the entry values array and update the location.
    entry.value = Array.isArray(entry.value) ? entry.value.concat([response.secure_url]) : [response.secure_url]

    postUpdate(entry)
}

async function trash(e, entry) {

    if (!confirm('Remove item?')) return;

    // Send request to cloudinary to destroy resource.
    await mapp.utils.xhr(`${entry.location.layer.mapview.host}/api/provider/cloudinary?${mapp.utils.paramString({
        destroy: true,
        public_id: e.target.dataset.name,
        folder: entry.cloudinary_folder
    })}`)

    // Remove the resource link from the entry values array and update the location.
    const valueSet = new Set(entry.value)

    valueSet.delete(e.target.dataset.src || e.target.dataset.href)

    entry.value = valueSet.size ? Array.from(valueSet) : null;

    postUpdate(entry)
}


async function postUpdate(entry) {

    entry.location.view?.classList.add('disabled')
  
    // Update the geometry field value.
    await mapp.utils.xhr({
      method: 'POST',
      url:
        `${entry.location.layer.mapview.host}/api/location/update?` +
        mapp.utils.paramString({
          locale: entry.location.layer.mapview.locale.key,
          layer: entry.location.layer.key,
          table: entry.location.table,
          id: entry.location.id,
        }),
      body: JSON.stringify({ [entry.field]: entry.value }),
    })

    const content = mapp.ui.locations.entries[entry.type](entry)

    mapp.utils.render(entry.node, content)

    entry.title && content.before(mapp.ui.locations.entries.title(entry))
  
    entry.location.view?.classList.remove('disabled')
  
  }